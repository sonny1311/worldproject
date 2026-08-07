export class AssetManager{
constructor(){this.images=new Map();}
async loadImage(name,path){
return new Promise((res,rej)=>{
const img=new Image();
img.onload=()=>{this.images.set(name,img);res(img);}
img.onerror=rej;
img.src=path;
});
}
getImage(name){return this.images.get(name);}
}