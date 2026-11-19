// Effect artwork uses local coordinates; its endpoints remain in world space.
export function effectRay(e,fallback){
 const from=Number.isFinite(e.fromX)&&Number.isFinite(e.fromY)?{x:e.fromX-e.x,y:e.fromY-e.y}:fallback;
 const to=Number.isFinite(e.toX)&&Number.isFinite(e.toY)?{x:e.toX-e.x,y:e.toY-e.y}:{x:0,y:0};
 const dx=to.x-from.x,dy=to.y-from.y;
 return {from,to,angle:Math.hypot(dx,dy)>.01?Math.atan2(dy,dx):(e.facing===-1?Math.PI:0)};
}
