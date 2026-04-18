import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';

const canvas = createCanvas(1050, 600);
const ctx = canvas.getContext('2d');

// linear gradient background
const gr = ctx.createLinearGradient(0, 0, 1050, 600);
gr.addColorStop(0, '#1c1c28');
gr.addColorStop(1, '#2a2a3c');
ctx.fillStyle = gr;
ctx.fillRect(0, 0, 1050, 600);

// draw glass round rect
ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.roundRect(30, 30, 320, 540, 20);
ctx.fill();
ctx.stroke();

// check fonts
ctx.fillStyle = '#fff';
ctx.font = '30px sans-serif';
ctx.fillText('Test Text', 100, 100);

const buffer = canvas.encodeSync('png');
fs.writeFileSync('test.png', buffer);
console.log('Success - exported test.png');
