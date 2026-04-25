```python
const response = [
    {
        "order": 1,
        "text": "1. Superposition: Qubits exist in multiple states at once.",
        "duration": 6,
        "canvas_code": `
            ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, 800, 600);
            const CX = 400; const CY = 300;
            
            // Draw a spinning Bloch Sphere skeleton
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(CX, CY, 150, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.ellipse(CX, CY, 150, 50, 0, 0, Math.PI * 2); ctx.stroke();
            
            // The Qubit State Vector moving in superposition
            const vectorX = CX + Math.sin(time * 2) * 150 * Math.cos(time);
            const vectorY = CY + Math.cos(time * 2) * 150;
            
            ctx.shadowColor = '#00f2ff'; ctx.shadowBlur = 15;
            ctx.strokeStyle = '#00f2ff';
            ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(vectorX, vectorY); ctx.stroke();
            
            ctx.fillStyle = '#00f2ff';
            ctx.beginPath(); ctx.arc(vectorX, vectorY, 8, 0, Math.PI * 2); ctx.fill();
            
            // "Ghost" states representing 0 and 1
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = 'white';
            ctx.fillText('|0>', CX, CY - 170);
            ctx.fillText('|1>', CX, CY + 180);
            ctx.globalAlpha = 1.0;
        `
    },
    {
        "order": 2,
        "text": "2. Entanglement: Qubits become perfectly synchronized.",
        "duration": 8,
        "canvas_code": `
            ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, 800, 600);
            const p1X = 250; const p2X = 550; const Y = 300;
            
            // Draw the "Quantum Link"
            ctx.strokeStyle = 'rgba(191, 0, 255, 0.3)';
            ctx.lineWidth = 4;
            ctx.setLineDash([10, 15]);
            ctx.lineDashOffset = -time * 50;
            ctx.beginPath(); ctx.moveTo(p1X, Y); ctx.lineTo(p2X, Y); ctx.stroke();
            ctx.setLineDash([]);
            
            // Draw Entangled Qubits pulsing together
            const syncPulse = Math.sin(time * 5);
            [p1X, p2X].forEach(x => {
                const glow = 15 + syncPulse * 10;
                ctx.shadowColor = '#bf00ff'; ctx.shadowBlur = glow;
                ctx.fillStyle = '#bf00ff';
                ctx.beginPath(); ctx.arc(x, Y, 30, 0, Math.PI * 2); ctx.fill();
                
                // Orbiting electrons
                for(let i=0; i<2; i++) {
                    const orbX = x + Math.cos(time * 3 + (i * Math.PI)) * 60;
                    const orbY = Y + Math.sin(time * 3 + (i * Math.PI)) * 20;
                    ctx.fillStyle = 'white';
                    ctx.beginPath(); ctx.arc(orbX, orbY, 4, 0, Math.PI * 2); ctx.fill();
                }
            });
        `
    },
    {
        "order": 3,
        "text": "3. Interference: Collapsing waves into the correct result.",
        "duration": 6,
        "canvas_code": `
            ctx.fillStyle = '#050510'; ctx.fillRect(0, 0, 800, 600);
            
            // Interference Waves
            ctx.lineWidth = 2;
            for(let i=0; i<10; i++) {
                const waveY = 100 + i * 40;
                ctx.beginPath();
                ctx.moveTo(0, waveY);
                for(let x=0; x<800; x+=10) {
                    // Constructive and Destructive Interference simulation
                    const amp = (i === 5) ? 40 : 10; // Peak result at row 5
                    const freq = 0.05;
                    const y = waveY + Math.sin(x * freq + time * 10) * amp;
                    ctx.lineTo(x, y);
                }
                ctx.strokeStyle = (i === 5) ? '#39ff14' : 'rgba(0, 255, 255, 0.2)';
                ctx.stroke();
            }
            
            // Final Measured Value
            if (time % 2 > 1.5) {
                ctx.shadowColor = '#39ff14'; ctx.shadowBlur = 30;
                ctx.fillStyle = '#39ff14';
                ctx.font = "bold 60px Arial";
                ctx.fillText("RESULT: 1", 400, 520);
            }
        `
    }
];
```
