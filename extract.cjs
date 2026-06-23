const fs = require('fs');

const transcriptPath = 'C:\\Users\\kawe.pinto\\.gemini\\antigravity-ide\\brain\\cc8af30a-a38f-44af-aeb9-733036cb92cf\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  if (!lines[i]) continue;
  try {
    const entry = JSON.parse(lines[i]);
    if (entry.tool_calls) {
      for (const call of entry.tool_calls) {
        if (call.name === 'write_to_file' || call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
           if (call.arguments && call.arguments.includes('Layout.tsx')) {
               console.log('FOUND MODIFICATION in step', entry.step_index);
               console.log(JSON.stringify(call, null, 2));
           }
        }
      }
    }
  } catch (e) {}
}
