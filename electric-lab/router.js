// Orthogonal lead routing around device bodies. Intersections do not create junctions.
export function routeLead(a,b,obstacles,offset=0){
 const port=t=>{const box=obstacles.find(o=>t.x>=o.x&&t.x<=o.x+o.w&&t.y>=o.y&&t.y<=o.y+o.h);const up=['qi','a1','a2'].includes(t.id);return {x:t.x,y:box?(up?box.y-18:box.y+box.h+18):t.y+(up?-30:30)};};
 const pa=port(a),pb=port(b),step=10;const start=[Math.round(pa.x/step),Math.round(pa.y/step)],end=[Math.round(pb.x/step),Math.round(pb.y/step)];
 const key=(x,y)=>x+','+y,blocked=(x,y)=>obstacles.some(o=>x*step>o.x-7&&x*step<o.x+o.w+7&&y*step>o.y-7&&y*step<o.y+o.h+7);
 const heap=[];function push(n){heap.push(n);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].f<=n.f)break;heap[i]=heap[p];i=p;}heap[i]=n;}function pop(){const n=heap[0],last=heap.pop();if(heap.length){let i=0;heap[0]=last;while(true){let j=i*2+1;if(j>=heap.length)break;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(heap[j].f>=last.f)break;heap[i]=heap[j];i=j;}heap[i]=last;}return n;}
 const distances=new Map(),parents=new Map();const h=(x,y)=>Math.abs(x-end[0])+Math.abs(y-end[1]);push({x:start[0],y:start[1],g:0,f:h(...start),dir:-1});distances.set(key(...start),0);let found=false;
 while(heap.length){const n=pop(),nk=key(n.x,n.y);if(n.g>distances.get(nk))continue;if(n.x===end[0]&&n.y===end[1]){found=true;break;}for(const [dx,dy,dir]of [[1,0,0],[-1,0,0],[0,1,1],[0,-1,1]]){const x=n.x+dx,y=n.y+dy;if(x<4||x>101||y<5||y>62||blocked(x,y))continue;const k=key(x,y),g=n.g+1+(n.dir>=0&&n.dir!==dir?.35:0)+((y+offset)%5===0?0:.015);if(g>=(distances.get(k)??Infinity))continue;distances.set(k,g);parents.set(k,nk);push({x,y,g,f:g+h(x,y),dir});}}
 let pts=[];if(found){let k=key(...end);while(k){const [x,y]=k.split(',').map(Number);pts.push([x*step,y*step]);k=parents.get(k);}pts.reverse();}else pts=[[pa.x,pa.y],[pb.x,pa.y],[pb.x,pb.y]];
 // Extra short horizontal segments align exact terminals with the routing grid.
 let full=[[a.x,a.y],[pa.x,pa.y],[pa.x,pts[0][1]],...pts,[pb.x,pts.at(-1)[1]],[pb.x,pb.y],[b.x,b.y]];
 full=full.filter((p,i)=>!i||p[0]!==full[i-1][0]||p[1]!==full[i-1][1]);
 full=full.filter((p,i)=>i===0||i===full.length-1||!((p[0]===full[i-1][0]&&p[0]===full[i+1][0])||(p[1]===full[i-1][1]&&p[1]===full[i+1][1])));
 return full.map((p,i)=>(i?'L':'M')+p[0]+' '+p[1]).join(' ');
}
