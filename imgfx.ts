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
    export function squishImageX(imag: Image, stretch: number, time: number) {
        const og = imag.clone()
        let out = image.create(og.width, og.height)
        let buf: Buffer = Buffer.create(og.height)
        for (let x = 0; x < og.width; x++) {
            og.getRows(Math.mod((x + Math.sin(x / 10 + (time / 1000)) * stretch), og.width), buf)
            out.setRows(x, buf)
        }
        return out
    }

    export function squishImageY(imag: Image, stretch: number, time: number) {
        const og = imag.clone()
        let out = image.create(og.width, og.height)
        let buf: Buffer = Buffer.create(og.width)
        for (let x = 0; x < og.width; x++) {
            og.getColumns(Math.mod((x + Math.sin(x / 10 + (time / 1000)) * stretch), og.width), buf)
            out.setColumns(x, buf)
        }
        return out
    }
}

