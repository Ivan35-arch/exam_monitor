const pdfParse = require('pdf-parse');

/**
 * Parses the raw text from the Strathmore University Exam Timetable PDF
 * and extracts individual exam entries.
 * 
 * @param {Buffer} pdfBuffer - The raw PDF buffer from multer
 * @returns {Promise<Array>} - Array of parsed exam objects
 */
async function parseTimetable(pdfBuffer) {
    const data = await pdfParse(pdfBuffer);
    const text = data.text;
    const lines = text.split('\n');

    const exams = [];

    // State variables carried forward
    let currentDate = null;
    let currentStartTime = null;
    let currentEndTime = null;
    let currentUnitCode = null;
    let currentUnitName = null;

    // Matches "Monday, 1st December 2025." or similar
    const dateRegex = /^[A-Z][a-z]+,\s+\d{1,2}(st|nd|rd|th)\s+[A-Z][a-z]+\s+\d{4}\.?$/i;
    
    // Matches "08:30 - 10:30"
    const timeRegex = /^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/;
    
    // Matches Unit Code & potentially the start of Unit Name
    // e.g. "ICS 1206: Principles of Management"
    const unitRegex = /^([A-Z]{2,4}\s+\d{4}[A-Z]*):\s+(.+)/;

    // Known venues to help split the end of the line
    const venuePattern = /(FORGE GF|FORGE F1|FORGE F2|AUDITORIUM|BLUESKY|MSB\s*\d+|LT\s*\d+|KINDARUMA|MASINGA|SUSWA)/i;

    const calculateDuration = (start, end) => {
        if (!start || !end) return 0;
        const [startHr, startMin] = start.split(':').map(Number);
        const [endHr, endMin] = end.split(':').map(Number);
        return (endHr * 60 + endMin) - (startHr * 60 + startMin);
    };

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        if (!line) continue;
        if (line.includes('CHIEF') && line.includes('INVIGILATOR')) continue;
        if (line.includes('Strathmore University') || line.includes('End of Semester Timetable')) continue;

        // 1. Check Date
        if (dateRegex.test(line)) {
            // e.g. "Monday, 1st December 2025." -> "1 December 2025"
            let cleanDate = line.replace(/(\d+)(st|nd|rd|th)/, '$1').replace('.', '').split(',')[1].trim();
            currentDate = new Date(cleanDate);
            continue;
        }

        // 2. Check Time
        const timeMatch = line.match(timeRegex);
        if (timeMatch) {
            currentStartTime = timeMatch[1];
            currentEndTime = timeMatch[2];
            line = line.replace(timeMatch[0], '').trim();
            
            // New time slot means new unit, clear previous
            currentUnitCode = null;
            currentUnitName = null;
        }

        // 3. Check Unit Code & Name (could be on the same line as time, or first line of a new block)
        const unitMatch = line.match(unitRegex);
        if (unitMatch) {
            currentUnitCode = unitMatch[1].trim();
            let remainder = unitMatch[2].trim();
            
            // The remainder contains: Unit Name + Group + Count + Venue + Invigilator
            // We need to separate Unit Name from Group Name.
            // Venues are known. Student count is a number right before venue.
            
            const vMatch = remainder.match(venuePattern);
            if (vMatch) {
                const venueStr = vMatch[0];
                const venueIndex = remainder.indexOf(venueStr);
                
                // Everything before venue is "Unit Name + Group Name + Student Count"
                let beforeVenue = remainder.substring(0, venueIndex).trim();
                
                // Last word before venue is student count
                const lastSpace = beforeVenue.lastIndexOf(' ');
                let studentCount = parseInt(beforeVenue.substring(lastSpace + 1), 10);
                
                let unitAndGroup = beforeVenue;
                if (!isNaN(studentCount)) {
                    unitAndGroup = beforeVenue.substring(0, lastSpace).trim();
                }

                // Now separate Unit Name from Group Name
                // This is the tricky part since we don't have a strict delimiter.
                // We'll rely on the known group prefixes (ICS, BBIT, BCOM, CNS, SDS, ACT, FENG, FE, etc.)
                const groupPrefixRegex = /\s(ICS|BBIT|BCOM|CNS|SDS|ACT|FENG|FE|BHM|BTM|BTH|AFFE|BSCM|BFS)\b/i;
                const groupMatch = unitAndGroup.match(groupPrefixRegex);
                
                if (groupMatch) {
                    currentUnitName = unitAndGroup.substring(0, groupMatch.index).trim();
                    let groupName = unitAndGroup.substring(groupMatch.index + 1).trim();
                    
                    // Add exam
                    exams.push({
                        unit_code: currentUnitCode,
                        unit_name: currentUnitName,
                        group_name: groupName,
                        exam_date: currentDate.toISOString().split('T')[0],
                        exam_time: currentStartTime + ':00',
                        duration_minutes: calculateDuration(currentStartTime, currentEndTime),
                        venue: venueStr.trim()
                    });
                }
            } else {
                // If we couldn't find a venue, it might be a weirdly wrapped line. Just store unit name for now.
                currentUnitName = remainder;
            }
            continue; // Move to next line
        }

        // 4. Handle continuation lines (multiple groups for same unit)
        // These lines won't have time or unit code, just: Group + Count + Venue + Invigilator
        // Or sometimes it's just a shared exam line.
        if (currentUnitCode && currentStartTime && currentDate && !timeMatch && !unitMatch) {
            const vMatch = line.match(venuePattern);
            if (vMatch) {
                const venueStr = vMatch[0];
                const venueIndex = line.indexOf(venueStr);
                
                let beforeVenue = line.substring(0, venueIndex).trim();
                const lastSpace = beforeVenue.lastIndexOf(' ');
                let studentCount = parseInt(beforeVenue.substring(lastSpace + 1), 10);
                
                let groupName = beforeVenue;
                if (!isNaN(studentCount)) {
                    groupName = beforeVenue.substring(0, lastSpace).trim();
                }

                exams.push({
                    unit_code: currentUnitCode,
                    unit_name: currentUnitName || 'Unknown Unit Name',
                    group_name: groupName,
                    exam_date: currentDate.toISOString().split('T')[0],
                    exam_time: currentStartTime + ':00',
                    duration_minutes: calculateDuration(currentStartTime, currentEndTime),
                    venue: venueStr.trim()
                });
            }
        }
    }

    return exams;
}

module.exports = { parseTimetable };
