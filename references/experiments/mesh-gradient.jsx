// Mesh Gradient Loop - After Effects ExtendScript
// Organic amoeba / cell-splitting feel
// 1920x1080 | 24fps | 10 sec cycle loop

(function () {

  function hexToRgb(hex) {
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255
    ];
  }

  // Ellipse mask shape centered at (cx,cy) with radii rx, ry
  function ellipseShape(cx, cy, rx, ry) {
    var k = 0.5523;
    var s = new Shape();
    s.vertices    = [[cx, cy-ry], [cx+rx, cy], [cx, cy+ry], [cx-rx, cy]];
    s.inTangents  = [[-rx*k,0], [0,-ry*k], [rx*k,0], [0,ry*k]];
    s.outTangents = [[rx*k,0], [0,ry*k], [-rx*k,0], [0,-ry*k]];
    s.closed = true;
    return s;
  }

  var proj = app.project;
  var dur  = 10;
  var fps  = 24;
  var W    = 1920;
  var H    = 1080;
  // 2x comp size so feather always fades before hitting layer edge
  var BW   = W * 2;
  var BH   = H * 2;
  var CX   = BW / 2;
  var CY   = BH / 2;

  var MID     = hexToRgb("4B749F");
  var DARK    = hexToRgb("34536e");
  var LIGHT   = hexToRgb("8FAFC8");
  var PALE    = hexToRgb("c5d9e8");
  var DARKEST = hexToRgb("1a2e3d");

  var comp = proj.items.addComp("Mesh Gradient Loop", W, H, 1, dur, fps);
  comp.bgColor = MID;

  comp.layers.addSolid(MID, "BG", W, H, 1, dur);

  // keys: array of [time, x, y] — first and last position must match for seamless cycle
  // Large movements (300–600px between waypoints) = visible organic motion
  var blobs = [
    {
      // Focal dark mass — sweeps bottom of frame, most dramatic movement
      name    : "Core Dark",
      color   : DARKEST,
      keys    : [[0,960,950],[2,580,720],[4,1180,520],[6,1350,880],[8,700,980],[10,960,950]],
      rx:900, ry:640, feather:480, op:90
    },
    {
      // Cell splitting left — emerges from core, drifts upper-left
      name    : "Cell Left",
      color   : DARK,
      keys    : [[0,620,800],[2,280,520],[4,480,260],[6,820,420],[8,500,680],[10,620,800]],
      rx:780, ry:620, feather:440, op:82
    },
    {
      // Cell splitting right — splits the opposite direction
      name    : "Cell Right",
      color   : DARK,
      keys    : [[0,1280,800],[2,1640,580],[4,1420,280],[6,1100,480],[8,1500,750],[10,1280,800]],
      rx:780, ry:620, feather:440, op:78
    },
    {
      // Light mass flowing across top
      name    : "Light Flow Top",
      color   : LIGHT,
      keys    : [[0,1380,180],[2,860,300],[4,480,180],[6,200,380],[8,900,260],[10,1380,180]],
      rx:740, ry:580, feather:420, op:68
    },
    {
      // Pale highlight — blooms and contracts upper right
      name    : "Pale Bloom",
      color   : PALE,
      keys    : [[0,1600,220],[2,1820,480],[4,1580,700],[6,1280,420],[8,1700,200],[10,1600,220]],
      rx:700, ry:560, feather:400, op:62
    },
    {
      // Mid tone roaming center — ties everything together
      name    : "Mid Roam",
      color   : MID,
      keys    : [[0,900,500],[2,1200,380],[4,1000,620],[6,680,440],[8,1080,560],[10,900,500]],
      rx:720, ry:580, feather:410, op:60
    },
    {
      // Light lower right — counters the dark bottom blob
      name    : "Light SE",
      color   : LIGHT,
      keys    : [[0,1700,900],[2,1480,680],[4,1780,500],[6,1920,780],[8,1600,960],[10,1700,900]],
      rx:700, ry:540, feather:390, op:58
    }
  ];

  for (var i = 0; i < blobs.length; i++) {
    var d     = blobs[i];
    var layer = comp.layers.addSolid(d.color, d.name, BW, BH, 1, dur);

    // Set position keyframes along the organic path
    var pos = layer.property("Transform").property("Position");
    for (var k = 0; k < d.keys.length; k++) {
      pos.setValueAtTime(d.keys[k][0], [d.keys[k][1], d.keys[k][2]]);
    }
    // Cycle loop: last keyframe = first, so it loops seamlessly
    pos.expression = 'loopOut("cycle")';

    // Ellipse mask with heavy feather
    var mask = layer.Masks.addProperty("Mask");
    mask.property("Mask Path").setValue(ellipseShape(CX, CY, d.rx, d.ry));
    mask.property("Mask Feather").setValue([d.feather, d.feather]);
    mask.property("Mask Opacity").setValue(100);

    layer.blendingMode = BlendingMode.NORMAL;
    layer.property("Transform").property("Opacity").setValue(d.op);
  }

  alert("Done! Comp: Mesh Gradient Loop\n1920x1080  24fps  10s\n7 organic blobs, cycle loop.\n\nPress 0 on numpad to RAM preview.");

})();
