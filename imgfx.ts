namespace Math {
    export function mod(a: number, n: number): number {
        if (n == 0) {
            return a
        }
        return (((a % n) + n) % n);
    }
}

interface Image {
    //% helper=getColumns
    getColumns(y: number, dst: Buffer): void;
    //% helper=setColumns
    setColumns(y: number, dst: Buffer, offset: Number): void;
    //% helper=blitColumn
    blitColumn(x: number, y: number, from: Image, fromY: number, fromW: number): void;
}

namespace helpers {
    //declare function _getColumns(img: Image, y: number, dst: Buffer): void;

    //declare function _setColumns(img: Image, y: number, dst: Buffer): void;

    export function getColumns(img: Image, y : number, dst: Buffer): void {
        let sp = 0
        let w = img.width
        let h = img.height
        if (y >= h || y < 0) {
            return
        }

        dst.setUint8(1, img.getPixel(0, y))
        let n = Math.min(dst.length, (w - y) * h)
        //uint8_t * dp = dst.data;
        //let n = min(dst.length, (w - x) * h) >> 1;

        while (n--) {
            dst.setUint8(sp, img.getPixel(sp, y))
            sp++;
        }
        return
    }

    export function setColumns(img: Image, y: number, src: Buffer, offset: number): void {
        let sp = 0
        offset = offset || 0
        let w = img.width
        let h = img.height
        if (y >= h || y < 0) {
            return
        }

        let n = Math.min(src.length, (w - y) * h)
        //uint8_t * dp = dst.data;
        //let n = min(dst.length, (w - x) * h) >> 1;

        while (n--) {
            img.setPixel(Math.mod((sp + offset), screen.width), y, src[sp])
            sp++;
        }
        return
    }

    export function blitColumn(img: Image, x:number, y:number, from: Image, fromY:number, fromW:number): void {

    }
}


namespace imgfx {
    const Dither = img`
        1 1 1 1 . 1 1 1 . 1 1 1 . 1 1 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . . . 1 . . . 1 . . . 1 . . . .
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 . 1 1 1 . 1 1 1 . 1 1 1 . 1 . . . 1 . . . 1 . . . 1 . . . . . . . . . . . . . . . . . . . . .
        1 1 1 1 1 1 1 1 1 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . 1 . . . . . . . . . .
        1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 . 1 . 1 . 1 . 1 . 1 . 1 . . . 1 . . . . . . . . . . . . . . . . . . . . . . . . .
    `;
    export function squishImageX(img: Image, stretch: number, time: number) {
        let w = img.width
        let h = img.height
        const og = img.clone()
        let out = image.create(w, h)
        let buf: Buffer = Buffer.create(h)
        for (let x = 0; x < w; x++) {
            let sin = Math.mod((x + Math.sin(x / 10 + (time / 1000)) * stretch), w)
            og.getRows(sin, buf)
            out.setRows(x, buf)
        }
        return out
    }

    export function squishImageY(img: Image, stretch: number, time: number) {
        let w = img.width
        let h = img.height
        const og = img.clone()
        let out = image.create(w, h)
        let buf: Buffer = Buffer.create(w)
        for (let y = 0; y < h; y++) {
            //let sin = (Math.sin((time / 1000) + (y * stretch)) * stretch)
            let sin = Math.sin(y / 10 + (time / 1000)) * stretch
            out.blit(0, y, w, h, img, 0, y - sin, w, h, false, false)
        }
        return out
    }

    export function heatY(img: Image, stretch: number, height: number, time: number, oscillate : Boolean) {
        let w = img.width
        let h = img.height
        const og = img.clone()
        let out = image.create(w, h)
        for (let x = 0; x < w; x++) {
            let sin = (Math.sin((time / 1000) + (stretch * x)) * height)
            if (oscillate == true && x % 2 == 0) {
                sin *= -1
            }
            out.blitRow(x, sin*1, og, x, w)
        } 
        return out
    }

    export function heatX(img: Image, stretch: number, width: number, time: number, oscillate: Boolean) {
        let w = img.width
        let h = img.height
        const og = img.clone()
        let out = image.create(w, h)
        //let buf: Buffer = Buffer.create(w)
        for (let y = 0; y < h; y++) {
            let sin = (Math.sin((time / 1000) + (y * stretch)) * width)
            if (oscillate == true && y % 2 == 0) {
                //sin *= -1
            }
            //out.blit(sin, y, w, h, img, 0, y, w, h, false, false)
            out.blit(0, y+sin, w, h, img, 0, y, w, h, false, false)
        }
        return out
    }

    export function dither(img: Image, threshold: number, color: number = 0, img2: Image = null, offx: number = 0, offy: number = 0) {
        let w = img.width
        let h = img.height
        //let imageData : number[] = []
        let og = img.clone()
        for (let y = 0; y < h; y++) {
            const screeny = (h >> 1) + (y | 0) - 1 + Math.abs(offy)
            for (let x = 0; x < w; x++) {
                const ditherOffset = Math.floor(Math.mod(threshold, 17)) * 4;
                let screenx = (w >> 1) + (x | 0) + Math.abs(offx)
                let ditherX = ditherOffset + (screenx % 4);
                let ditherY = screeny % 4;
                let ditherPixel = Dither.getPixel(ditherX, ditherY);
                let shaded = ditherPixel ? 1 : 0;
                if (shaded>=1) {
                    og.setPixel(x, y, color)
                    if (img2 != null) {
                        og.setPixel(x, y, img2.getPixel(x,y))
                    }
                }
            }
        }
        return og
    }

    export function repeatImage(img: Image, scrollx: number, scrolly: number, maxwidth: number, maxheight: number, scrollable : boolean = false) {
        let w = img.width
        let h = img.height
        let out = image.create(maxwidth, maxheight)

        let x: number;
        let y: number;
        if (scrollx >= 0) {
            x = -Math.floor(scrollx % w);
        }
        else {
            x = -(w - Math.floor(Math.abs(scrollx) % w));
        }

        if (scrolly >= 0) {
            y = -Math.floor(scrolly % h);
        }
        else {
            y = -(h - Math.floor(Math.abs(scrolly) % h));
        }

        for (y; y < maxheight + h; y += h) {
            for (let x2 = x; x2 < maxwidth + w; x2 += w) {
                out.drawTransparentImage(img, x2, y)
            }
        }
        
        return out
    }
}

