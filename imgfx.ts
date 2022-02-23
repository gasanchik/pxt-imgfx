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
}

namespace helpers {
    declare function _getColumns(img: Image, y: number, dst: Buffer): void;

    declare function _setColumns(img: Image, y: number, dst: Buffer): void;

    export function getColumns(img: Image, y: number, dst: Buffer): void {
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
}


namespace imgfx {
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

    export function heatY(img: Image, stretch: number, height:number, time: number) {
        let w = img.width
        let h = img.height
        const og = img.clone()
        for (let i = 0; i < w; i++) {
            screen.blitRow(i, (Math.sin((time / 1000) + (i * stretch)) * height) - (height/2), og, i, 160+height)
        }
        return og
    }
}

