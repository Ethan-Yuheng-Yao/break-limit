// Campaign coordinates are world coordinates; the camera never moves the simulation.
export function campaignTerrain(stage){
 const width=stage.boss?3800:4200+stage.chapter*700+(stage.index%3)*400;
 const ground=[{x:0,y:644},{x:1250,y:644},{x:1530,y:570},{x:1930,y:570},{x:2240,y:675},{x:2670,y:675},{x:2970,y:610},{x:width-850,y:644},{x:width,y:644}].sort((a,b)=>a.x-b.x);
 const platforms=[{x:740,y:505,width:280},{x:1660,y:420,width:260},{x:2350,y:520,width:300},{x:3040,y:455,width:260}];
 if(width>4600)platforms.push({x:3830,y:490,width:310});
 return {width,ground,platforms:platforms.filter(p=>p.x+p.width<width-550),theme:stage.theme};
}
export function groundHeight(terrain,x){
 const points=terrain.ground;let i=1;while(i<points.length-1&&x>points[i].x)i++;
 const a=points[i-1],b=points[i],p=Math.max(0,Math.min(1,(x-a.x)/Math.max(1,b.x-a.x)));
 return a.y+(b.y-a.y)*p;
}
export function surfaceBelow(terrain,x,y){
 let floor=groundHeight(terrain,x);
 for(const p of terrain.platforms)if(x>=p.x&&x<=p.x+p.width&&y<=p.y+2)floor=Math.min(floor,p.y);
 return floor;
}
export function landingHeight(terrain,x,previousY,nextY){
 let floor=groundHeight(terrain,x);
 if(nextY>=previousY)for(const p of terrain.platforms)if(x>=p.x&&x<=p.x+p.width&&previousY<=p.y+2&&nextY>=p.y)floor=Math.min(floor,p.y);
 return floor;
}
