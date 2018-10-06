var i = 0;

while(i < 1) {

    i++;

    // map is 4x4 //

    const _CELL_SIZE = 100;

    const _MAP = [
        [ 0, 0, 1, 0, ],
        [ 1, 0, 1, 0, ],
        [ 0, 0, 0, 1, ],
        [ 0, 0, 1, 0, ],
    ];

    const _PLAYER = {
        x: 0, //put player in center of map
        y: 0,
        direction: Math.PI, //looking "down"
        get vec() {
            return new Vector(
                _PLAYER.x,
                _PLAYER.y
            );
        },
    };


    // perform initialization of graphics //

    const _CANVAS = document.getElementById("canvas");
    if (!_CANVAS) {
        console.warn("no canvas found, exiting...");
        break;
    }
    _CANVAS.width = _MAP.length * _CELL_SIZE;
    _CANVAS.height = _MAP.length * _CELL_SIZE;

    const _CONTEXT = _CANVAS.getContext('2d');
    if (!_CONTEXT) {
        console.warn("couldn't init context on canvas, exiting...");
        break;
    }


    function draw_col(slice_index, slice_dist) {

        // enforce integer vals //
        slice_dist |= 0;
        slice_index |= 0;

        let slice_height = _CANVAS.height / (slice_dist+1);
        let top_offset = (_CANVAS.height - slice_height) / 2;
        _CONTEXT.fillStyle = 'green';
        _CONTEXT.fillRect(slice_index, top_offset, 1, slice_height);

    }


    function render() {

        render_map();
        for (let i = 0; i < _CANVAS.width; i++) {

            // for this column //
            let direction = direction_from_index(i);
            console.log(direction);
            if (i > 5) break;

            //  > cast ray to get ending vector //
            let evec = cast_ray2(_PLAYER.vec, direction);

            //  > use ending vector to get distance //
            let dist = get_dist(_PLAYER.vec, evec);

            //  > use distance to draw_col //
            draw_col(i, dist);
        }

    }


    function direction_from_index(i) {

        let resolution = _CANVAS.width;
        let fov = Math.PI * 0.7; // 70% of 180deg
        let delta = fov / resolution;
        let slope = Math.tan(delta * i); //review this one//
        // you'll have to rotate the slope later to get your true direction vec //
        let x = 1;
        let y = slope;
        return new Vector(x, y);

    }

    function get_dist(svec, dvec) {
        let x1 = svec.x;
        let y1 = svec.y;
        let x2 = dvec.x;
        let y2 = dvec.y;

        let a = x2 - x1;
        let b = y2 - y1;
        let c = Math.pow(a, 2) + Math.pow(b, 2);
        let d = Math.sqrt(c);
        console.log("distance for %f, %f is %f", x2, y2, d);
    }

    function render_map() {
        // [x] show map as top-down view //
        // [x] display the walls and floors //
        // [x] draw player position and direction //
        // [x] draw lines representing cast rays //

        draw_map_walls();
        draw_map_player();
        cast_rays();

    }


    function draw_map_player() {

        const s = 10; // player size //
        const hs = 5; // player size //
        const v = _PLAYER.vec.toScreenVec();
        _CONTEXT.fillStyle = "#08f";
        _CONTEXT.fillRect(v.x-hs, v.y-hs, s, s);
        draw_line(v, new Vector(v.x, v.y+s)); // show player direction //

    }


    function draw_line(vector_a, vector_b, style) {
        style = style || "#08f";
        _CONTEXT.beginPath();
        _CONTEXT.moveTo(vector_a.x, vector_a.y);
        _CONTEXT.lineTo(vector_b.x, vector_b.y);
        _CONTEXT.strokeStyle = style;
        _CONTEXT.stroke();
    }


    function cast_rays() {
        var svec = _PLAYER.vec;
        draw_line(svec.toScreenVec(), cast_ray2(svec, new Vector(0, 1)   ).toScreenVec());
        draw_line(svec.toScreenVec(), cast_ray2(svec, new Vector(0.5, 1) ).toScreenVec());
        draw_line(svec.toScreenVec(), cast_ray2(svec, new Vector(1, 1)   ).toScreenVec());
        draw_line(svec.toScreenVec(), cast_ray2(svec, new Vector(1, 0.5) ).toScreenVec());
        draw_line(svec.toScreenVec(), cast_ray2(svec, new Vector(1, 0)   ).toScreenVec());
    }

    function Vector(x, y) {
        this.x = x;
        this.y = y;
    }

    Vector.prototype.toScreenVec = function() {
        return new ScreenVec(
            this.x * _CELL_SIZE,
            this.y * _CELL_SIZE
        )
    };


    function ScreenVec(x, y) {
        this.x = x;
        this.y = y;
    }


    function draw_map_walls() {
        for (let y = 0; y < _MAP.length; y++) {
            let row = _MAP[y];
            for (let x = 0; x < row.length; x++) {
                if (row[x]) {
                    draw_square(x, y);
                }
            }
        }
    }


    function draw_square(x, y) {
        let w = _CELL_SIZE;
        let h = _CELL_SIZE;
        x *= _CELL_SIZE;
        y *= _CELL_SIZE;
        _CONTEXT.fillStyle = '#f' + [].slice.call((Math.random()*1000).toString(16)).shift() + '8';
        _CONTEXT.fillRect(x, y, w, h);
    }

    render();


    function cast_ray(vec)
    {
        // normalize so the largest number equals 1 //
        var x = vec.x,
            y = vec.y,
            g = Math.max(x, y);

        x /= g;
        y /= g;

        var i = 1,
            max_distance = 6 * 2;

        if (touches_wall(x, y))
            return new Vector(x, y);

        var min, factor, max;
        while (i < max_distance) {

            // quantize smallest axis //
            min = Math.min(x, y) || 1;
            factor = i/min;
            x *= factor;
            y *= factor;
            if (touches_wall(x, y)) {
                break;
            }

            i++;

            // quantize largest axis //
            max = Math.max(x, y);
            if (max % 1 === 0) {
                i++;
            }
            factor = i/max;
            x *= factor;
            y *= factor;
            if (touches_wall(x, y)) {
                break;
            }

        }

        var rvec = new Vector(x, y);
        return rvec;
    }

    function cast_ray2(svec, dvec)
    {

        // get equation of line //
        //console.log("svec: ", svec.x, svec.y);
        //console.log("dvec: ", dvec.x, dvec.y);
        svec.x = svec.x || 0.0001; // deal with div-by-0 error //
        //svec.y = svec.y || 0.0001;

        var m, x, y, b;

        // get slope //
        m = (dvec.y-svec.y) / (dvec.x-svec.x);

        // get y-intercept //
        b = svec.y - m * svec.x;

        for (var i = 0; i < 5; i++) {

            x = i;
            y = m*x + b;
            //console.log("y m x b: ", y, m, x, b);
            if (touches_wall(x, y))
                break;

            // or //
            y = i;
            x = (y - b)/m;

            if (isNaN(x))
                x = 0;

            if (x === Infinity)
                x = 0x7FFFFFFFFFFFFFFF; // largest i64 value

            //console.log(y, m, x, b);

            if (touches_wall(x, y))
                break;

        }

        return new Vector(x, y);
    }

    function touches_wall(x, y) {
        // check in _MAP to see if x AND y are within a wall's limits //
        x = Math.floor(Math.min(x, _MAP.length - 1));
        y = Math.floor(Math.min(y, _MAP.length - 1));
        if (x < 0 || x >= _MAP.length || y < 0 || y >= _MAP.length)
            return false;

        var result = _MAP[y][x] === 1;
        return result;
    }
}
