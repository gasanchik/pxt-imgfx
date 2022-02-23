namespace Math {
    export function mod(a: number, n: number): number {
        return ((a % n) + n) % n;
    }
}

interface Image {
    //% helper=getColumns
    getColumns(y: number, dst: Buffer): void;
    //% helper=setColumns
    setColumns(y: number, dst: Buffer): void;
    //% helper=blitColumn
    blitColumn(y: number, dst: Buffer): void;
}

namespace helpers {
    //declare function _getColumns(img: Image, y: number, dst: Buffer): void;

    //declare function _setColumns(img: Image, y: number, dst: Buffer): void;

    export function getColumns(img: Image, y : number, dst: Buffer): void {
        let dp = 0
        let sp = 0
        let w = img.width
        let h = img.height
        if (y >= h || y < 0) {
            return
        }

        dst.setUint8(dp, img.getPixel(0, y))
        let n = Math.min(dst.length, (w - y) * h)
        //uint8_t * dp = dst.data;
        //let n = min(dst.length, (w - x) * h) >> 1;

        while (n--) {
            dst.setUint8(sp, img.getPixel(sp, y))
            sp++;
        }
        return
    }

    export function setColumns(img: Image, y: number, src: Buffer): void {
        let dp = 0
        let sp = 0
        let w = img.width
        let h = img.height
        if (y >= h || y < 0) {
            return
        }

        let n = Math.min(src.length, (w - y) * h)
        //uint8_t * dp = dst.data;
        //let n = min(dst.length, (w - x) * h) >> 1;

        while (n--) {
            img.setPixel(sp, y, src[sp])
            sp += 1
        }
        return
    }

    export function blitColumn(img: Image, x:number, y:number, from: Image): void {

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
            og.getRows(Math.mod((x + Math.sin(x / 10 + (time / 1000)) * stretch), w), buf)
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
        for (let x = 0; x < w; x++) {
            og.getColumns(Math.mod((x + Math.sin(x / 10 + (time / 1000)) * stretch), w), buf)
            out.setColumns(x, buf)
        }
        return out
    }

    export function heatY(img: Image, stretch: number, height: number, time: number, oscillate : Boolean) {
        let w = img.width
        let h = img.height
        const og = img.clone()
        let out = image.create(w, h)
        for (let x = 0; x < w; x++) {
            let sin = (Math.sin((time / 1000) + (x * stretch)) * height)
            if (oscillate == true && x % 2 == 0) {
                sin *= -1
            }
            out.blitRow(x, sin - (height / 2), og, x, 161 + height)
        } 
        return out
    }

    export function heatX(img: Image, stretch: number, height:number, time: number) {
        let w = img.width
        let h = img.height
        const og = img.clone()
        let out = image.create(w, h)
        for (let x = 0; x < w; x++) {
            out.blitRow(x, (Math.sin((time / 1000) + (x * stretch)) * height) - (height / 2), og, x, 160+height)
        }
        return out
    }

    export function dither(img: Image, threshold : number, color : number) {
        let w = img.width
        let h = img.height
        //let imageData : number[] = []
        let og = img.clone()
        for (let y = 0; y < h; y++) {
            const screeny = (h >> 1) + (y | 0) - 1;
            for (let x = 0; x < w; x++) {
                const ditherOffset = Math.floor(Math.mod(threshold, 17)) * 4;
                let screenx = (w >> 1) + (x | 0);
                let ditherX = ditherOffset + (screenx % 4);
                let ditherY = screeny % 4;
                let ditherPixel = Dither.getPixel(ditherX, ditherY);
                let shaded = ditherPixel ? 1 : 0;
                if (shaded>=1) {
                    og.setPixel(x, y, color)
                }
            }
        }
        return og
    }
}

