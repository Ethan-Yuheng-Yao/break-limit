// Fixed-length two-bone arms. Clamp the wrist as well as the elbow so weapons
// remain in the hand when a dramatic keyframe reaches beyond the skeleton.
export function solveArm(sx,sy,hx,hy,bend,upper=36,lower=36){
 const dx=hx-sx,dy=hy-sy,d=Math.hypot(dx,dy),ux=d>.001?dx/d:0,uy=d>.001?dy/d:1;
 const reach=Math.max(10,Math.min(upper+lower-.5,d)),x=sx+ux*reach,y=sy+uy*reach;
 const along=(upper*upper-lower*lower+reach*reach)/(2*reach),height=Math.sqrt(Math.max(0,upper*upper-along*along));
 return {shoulder:{x:sx,y:sy},elbow:{x:sx+ux*along-uy*height*bend,y:sy+uy*along+ux*height*bend},hand:{x,y}};
}
export function armRig(pose,character){
 const ronin=character==='ronin';
 return {back:solveArm(ronin?-20:-17,ronin?-96:-95,pose.bx,pose.by,1),front:solveArm(ronin?21:17,-96,pose.hx,pose.hy,-1)};
}
