const dashscope = require('dashscope');
console.log('Exports:', Object.keys(dashscope));
if (dashscope.SpeechSynthesizer) console.log('SpeechSynthesizer found');
else console.log('SpeechSynthesizer NOT found');
