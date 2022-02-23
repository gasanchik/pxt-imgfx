namespace Math {
    export function mod(a: number, n: number): number {
        return ((a % n) + n) % n;
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
}

