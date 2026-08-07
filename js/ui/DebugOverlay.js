export class DebugOverlay{
draw(ctx,fps){
ctx.fillStyle='white';
ctx.font='16px Arial';
ctx.fillText('FPS: '+fps,10,20);
}
}