// ===========================================
// terrain.js
// ===========================================

export class Terrain{

    constructor(camera){

        this.camera=camera;

        this.tileWidth=64;

        this.tileHeight=32;

        this.size=40;

    }

    draw(ctx,canvas){

        const offsetX=canvas.width/2-this.camera.x;

        const offsetY=120-this.camera.y;

        for(let y=0;y<this.size;y++){

            for(let x=0;x<this.size;x++){

                const isoX=(x-y)*(this.tileWidth/2);

                const isoY=(x+y)*(this.tileHeight/2);

                this.drawTile(

                    ctx,

                    offsetX+isoX*this.camera.zoom,

                    offsetY+isoY*this.camera.zoom

                );

            }

        }

    }

    drawTile(ctx,x,y){

        const w=this.tileWidth*this.camera.zoom;

        const h=this.tileHeight*this.camera.zoom;

        ctx.beginPath();

        ctx.moveTo(x,y);

        ctx.lineTo(x+w/2,y+h/2);

        ctx.lineTo(x,y+h);

        ctx.lineTo(x-w/2,y+h/2);

        ctx.closePath();

        ctx.fillStyle="#73c96a";

        ctx.fill();

        ctx.strokeStyle="rgba(0,0,0,.15)";

        ctx.stroke();

    }

}