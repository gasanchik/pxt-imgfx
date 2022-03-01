namespace Math {
    /**
     * Loops a number between another number. 16 mod 5 would be 1.
     */
    //% block="%a mod %n"
    export function mod(a: number, n: number): number {
        if (n == 0) {
            return a
        }
        return (((a % n) + n) % n);
    }

    /**
     * Generates a new number that this function will only return with the two numbers you put in.
     */
    //% block="%x pair %y"
    export function cantorPair(x : number, y : number) {
        return (0.5 * (x + y) * (x + y + 1)) + y;
    }

    /**
     * Generates a new number that this function will only return with the two numbers you put in.
     * Works with Negative numbers.
     */
    //% block="%x pair %y"
    export function cantorPairSigned(x : number, y : number) {
        const a = (x >= 0.0 ? 2.0 * x : (-2.0 * x) - 1.0);
        const b = (y >= 0.0 ? 2.0 * y : (-2.0 * y) - 1.0);
        return Math.cantorPair(a,b)
    }
}

interface Image {
    //% helper=getColumns
    getColumns(y: number, dst: Buffer): void;
    //% helper=setColumns
    setColumns(y: number, dst: Buffer, offset: Number): void;
    //% helper=blitColumn
    blitColumn(x: number, y: number, from: Image, fromY: number, fromW: number): void;
    //% helper=getBufferFromPalette
    getBufferFromPalette(y: number): Buffer;
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

    function numberToHex(n: number) {
        let hex: string[] = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "F", "G"]
        return hex[Math.clamp(1, 16, n)]
    }

    function hexStringToBuffer(hex: string) {
        let buff = control.createBuffer(hex.length);
        for (let i = 0; i < hex.length; i += 1) {
            buff.setUint8(i, parseInt(hex.substr(i, 1), 16));
        }
        return buff;
    }

    /**
     * Gets a palette buffer from a column in a image.
     */
    export function getBufferFromPalette(img: Image, y: number): Buffer {
        let palleteB = "";
        let buffer: number[] = []
        for (let i = 0; i < 16; i++) {
            buffer.push(img.getPixel(i, y));
        }
        for (let i = 0; i < 16; i++) {
            palleteB = palleteB + numberToHex(buffer[i])
        }
        return hexStringToBuffer(palleteB)
    }
}

//% color=190 weight=10 icon="\uff1fb" block="Image effects" advanced=true
namespace imgfx {
    /*
    const bayerThresholdMap = [
        [15, 135, 45, 165],
        [195, 75, 225, 105],
        [60, 180, 30, 150],
        [240, 120, 210, 90]
    ];
    */
    const bayerThresholdMap = [
        [1, 49, 13, 61, 4, 52, 16, 64],
        [33, 17, 45, 29, 36, 20, 48, 32],
        [9, 57, 5, 53, 12, 60, 8, 56],
        [41, 25, 37, 21, 44, 28, 40, 24],
        [3, 51, 15, 63, 2, 50, 14, 62],
        [35, 19, 47, 31, 34, 18, 46, 30],
        [11, 59, 7, 55, 10, 58, 6, 54],
        [43, 27, 39, 23, 42, 26, 38, 22]
    ];
    /*
    const bayerThresholdMap = [
        [0, 2],
        [3, 1],
    ];
    */
    //const ditherStepX = [0, 2, 0, 2, 1, 1, 3, 3, 0, 2, 0, 2, 1, 3, 1, 3]
    //const ditherStepY = [0, 2, 2, 0, 1, 3, 3, 1, 1, 3, 3, 1, 0, 2, 2, 0]

    function ditherRow(buff: Buffer, x: number, threshold: number, col: number = 0, buff2: Buffer = null): void {
        let y = 0
        let dithering = Math.floor(Math.mod(threshold, 65))
        while (y <= buff.length) {
            let map = bayerThresholdMap[x % 8][y % 8]
            if (map < dithering + 1) {
                if (buff2 != null) {
                    buff.setUint8(y, buff2[y])
                } else {
                    buff.setUint8(y, col)
                }
            }
            y += 1
        }
    }

    /*
        *Makes a squishy effect on any image in the X axis.
        *@param image: The image that gets affected.
        *@param stretch: How much the image gets stretched.
        *@param time: Put game.runtime in time, or put any number you want in it. Acts as the frame of the animation.
    */
    //% blockId=squish_image_x
    //% block= block = field, { '|' field } field:= string string`%` parameter[`=` type ] parameter = string type = string
    //"squish image x %img=screen_image_picker scretch %stretch time %time"
    export function squishImageX(img : Image, stretch: number, time: number) {
        let w = img.width
        let h = img.height
        let out = image.create(w, h)
        let buf: Buffer = Buffer.create(h)
        for (let x = 0; x < w; x++) {
            let sin = (Math.sin(x / 10 + (time / 1000)) * stretch)
            img.getRows(Math.mod(Math.mod(sin + x, w), w), buf)
            out.setRows(x, buf)
        }
        return out
    }

    export function squishImageY(img: Image, stretch: number, time: number) {
        let w = img.width
        let h = img.height
        let out = image.create(w, h)
        //let og2 = img.clone()

        /*
        let out = null
        if (w > h) {
            out = image.create(w, w)
        } else if (h > w) {
            out = image.create(h, h)
        } else {
            out = image.create(h, h)
        }
        out.drawTransparentImage(og, 0, 0)
        out = out.transposed()
        out = imgfx.squishImageX(out, stretch, time)
        out = out.transposed()
        og = image.create(w, h)
        og.drawTransparentImage(out, 0, 0)
        */
        let buf: Buffer = Buffer.create(w)
        for (let y = 0; y < h; y++) {
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
                sin *= -1
            }
            out.blit(sin, y, w, h, img, 0, y, w, h, false, false)
            //out.blit(0, y+sin, w, h, img, 0, y, w, h, false, false)
        }
        return out
    }

    export function trueDither(imgFrom: Image, threshold: number, color: number = 0, imgTo: Image = null, offx: number = 0, offy: number = 0) {
        let w = imgFrom.width
        let h = imgFrom.height
        //let imageData : number[] = []
        let out = imgFrom.clone()
        let buff = Buffer.create(h)
        let buff2 = null
        if (imgTo != null) {
            buff2 = Buffer.create(h)
        }
        for (let x = 0; x < w; x++) {
            out.getRows(x, buff)
            if (buff2 != null) {
                imgTo.getRows(x, buff2)
            }
            ditherRow(buff, x, threshold, color, buff2)
            out.setRows(x, buff)
        }
        return out
    }

    export function optimizedDither(imgFrom: Image, threshold: number, color: number = 0, imgTo: Image = null, offx: number = 0, offy: number = 0) {
        let w = imgFrom.width
        let h = imgFrom.height
        let out = imgFrom.clone()
        if (imgTo) {
            color = 0
        }
        //let whiteOnlyImg : Image = imgFrom.clone()
        ///whiteOnlyImg.mapRect(0, 0, w, h, optimizedDitherBuffer)
        let ditherPattern = image.create(8,8)
        if (color == 0) {
            ditherPattern = trueDither(image.create(16, 16), threshold, 1)
        } else {
            ditherPattern = trueDither(image.create(16, 16), threshold, color)
        }
        let repeatedPattern = imgfx.repeatImage(ditherPattern, w, h, offx, offy)
        if (color == 0) {
            out.replace(1, 13)
        }
        out.drawTransparentImage(repeatedPattern, 0, 0)
        if (color == 0) {
            //whiteOnlyImg = imgFrom.clone()
            out.replace(1, 0)
        }
        if (imgTo) {
            let temp = imgTo.clone()
            //let temp2 = imgFrom.clone()
            temp.drawTransparentImage(out,0,0)
            //temp.drawTransparentImage(whiteOnlyImg, 0, 0)
            out = temp
        }
        return out
    }

    export function repeatImage(img: Image, maxwidth: number, maxheight: number, scrollx: number = 0, scrolly: number = 0, scrollable : boolean = false) {
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