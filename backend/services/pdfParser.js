const { execFile } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

/**
 * Executes the python script to parse the PDF timetable
 * 
 * @param {string} pdfPath - The absolute path to the uploaded PDF file
 * @returns {Promise<Array>} - Array of parsed exam objects
 */
async function parseTimetable(pdfPath) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '../scripts/parse_2025.py');
        
        // Find python executable in venv (works for both windows and linux)
        const isWindows = os.platform() === 'win32';
        const venvPythonPath = path.join(
            __dirname, 
            '../../venv', 
            isWindows ? 'Scripts/python.exe' : 'bin/python'
        );

        // Fallback to global python if venv doesn't exist
        const pythonExecutable = fs.existsSync(venvPythonPath) ? venvPythonPath : 'python';

        // maxBuffer is set to 50MB to handle potentially large JSON outputs
        execFile(pythonExecutable, [scriptPath, pdfPath], { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
            if (error) {
                console.error('Python Execution Error:', error);
                console.error('Stderr:', stderr);
                require('fs').writeFileSync('error2.log', JSON.stringify({
                    error: error ? error.message : null,
                    stderr: stderr,
                    pythonExecutable: pythonExecutable,
                    scriptPath: scriptPath,
                    pdfPath: pdfPath
                }, null, 2));
                return reject(new Error('Failed to execute python parsing script'));
            }
            
            try {
                // The python script should output STRICTLY JSON to stdout
                const result = JSON.parse(stdout);
                if (result.error) {
                    return reject(new Error(result.error));
                }
                resolve(result);
            } catch (parseError) {
                console.error('Error parsing python stdout:', parseError);
                console.error('Raw stdout:', stdout.substring(0, 500) + '...');
                reject(new Error('Invalid JSON output from python parsing script'));
            }
        });
    });
}

module.exports = { parseTimetable };
