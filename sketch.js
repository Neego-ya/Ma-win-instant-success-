// ================= 全局变量 =================
let octaves = 4;
let falloff = 0.5;

let tileSize = 20;
let gridResolutionX;
let gridResolutionY;
let debugMode = true;

let arrow;

// 马资源
let horse1, horse2, horse3, horse4;
let horsesMoving = [];

// 漂浮文字
let floatingTexts = [];

// 粒子
let particles = [];

let redPackets = [];

// 自动生成马
let spawnInterval = 140;
let spawnTimer = 0;

// 红包点击文字
let moneyTexts = [];
// 🔊 音效
let clickSound;
let audioStarted = false;


// ================= preload =================
function preload() {
  arrow = loadImage('Rectangle 1.svg');
  horse1 = loadImage('horse.png');
  horse2 = loadImage('horse2.png');
  horse3 = loadImage('horse3.png');
  horse4 = loadImage('horse4.png');
  // 🔊 加载音效
  clickSound = loadSound('click.wav');

}

// ================= setup =================
function setup() {
  createCanvas(windowWidth, windowHeight);
  cursor(CROSS);

  gridResolutionX = round(width / tileSize);
  gridResolutionY = round(height / tileSize);

  strokeCap(SQUARE);
  textFont('sans-serif');
}

// ================= draw =================
function draw() {
  background(255);
  noiseDetail(octaves, falloff);

  let noiseXRange = mouseX / 100;
  let noiseYRange = mouseY / 100;

  // -------- 背景噪波层 --------
  for (let gY = 0; gY <= gridResolutionY; gY++) {
    for (let gX = 0; gX <= gridResolutionX; gX++) {
      let posX = tileSize * gX;
      let posY = tileSize * gY;

      let noiseX = map(gX, 0, gridResolutionX, 0, noiseXRange);
      let noiseY = map(gY, 0, gridResolutionY, 0, noiseYRange);
      let noiseValue = noise(noiseX, noiseY);
      let angle = noiseValue * TAU;

      push();
      translate(posX, posY);

      if (debugMode) {
        noStroke();
        fill(noiseValue * 255);
        ellipse(0, 0, tileSize * 0.25);
      }

      noFill();
      stroke(0, 130, 164, 100);
      arc(0, 0, tileSize * 0.75, tileSize * 0.75, 0, angle);

      stroke(0);
      strokeWeight(0.75);
      rotate(angle);
      image(arrow, 0, 0, tileSize * 0.75, tileSize * 0.75);
      scale(1, -1);
      image(arrow, 0, 0, tileSize * 0.75, tileSize * 0.75);

      pop();
    }
  }

  // -------- 自动生成马 --------
  spawnTimer++;
  if (spawnTimer > spawnInterval) {
    spawnHorse(width + 80, random(80, height - 80));
    spawnTimer = 0;
    spawnInterval = max(30, spawnInterval - 10);
  }

  // -------- 马层 --------
  for (let i = horsesMoving.length - 1; i >= 0; i--) {
    let h = horsesMoving[i];
    h.update();
    h.show();
    if (h.isOut()) horsesMoving.splice(i, 1);
  }

  // -------- 粒子层 --------
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].isDead()) particles.splice(i, 1);
  }
  
  for (let i = redPackets.length - 1; i >= 0; i--) {
  let p = redPackets[i];
  p.update();
  p.show();
  if (p.isDead()) redPackets.splice(i, 1);
}



  // -------- 文字层 --------
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    let t = floatingTexts[i];
    t.update();
    t.show();
    if (t.isOut()) floatingTexts.splice(i, 1);
  }

    // -------- +1亿 文字层 --------
  for (let i = moneyTexts.length - 1; i >= 0; i--) {
    let m = moneyTexts[i];
    m.update();
    m.show();
    if (m.isDead()) moneyTexts.splice(i, 1);
  }

}

// ================= 鼠标点击 =================
function mousePressed() {
 // 🔊 解锁音频（只需一次）
  if (!audioStarted) {
    userStartAudio();
    audioStarted = true;
  }


  // 🐎 再检测马
  for (let i = horsesMoving.length - 1; i >= 0; i--) {
    let h = horsesMoving[i];
    if (h.isClicked(mouseX, mouseY)) {
       // 🔊 播放点击音效
      if (clickSound && clickSound.isLoaded()) {
        clickSound.play();
      }
      h.onClick();

      let txt = random() < 0.08 ? '马年大吉' : '成功';
      floatingTexts.push(
        new FloatingText(width / 2, height / 2, txt)
      );
      return;
    }
  }

  spawnHorse(mouseX, mouseY);
}


// ================= 生成马 =================
function spawnHorse(x, y) {
  let r = random();
  let img = r < 0.8 ? horse1 : r < 0.87 ? horse2 : r < 0.94 ? horse3 : horse4;
  horsesMoving.push(new MovingHorse(img, x, y));
}

// ================= 马类 =================
class MovingHorse {
  constructor(img, x, y) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.size = 100;

    this.dir = -1;
    this.speed = random(2, 4);

    this.rotation = 0;
    this.targetRotation = 0;

    this.swingAngle = random(TWO_PI);
    this.swingSpeed = random(0.02, 0.05);
    this.swingMax = PI / 12;

    this.clickCount = 0;
  }

  update() {
    this.x += this.speed * this.dir;
    this.swingAngle += this.swingSpeed;
    this.rotation = lerp(this.rotation, this.targetRotation, 0.15);
  }

  show() {
    let swing = sin(this.swingAngle) * this.swingMax;
    push();
    translate(this.x, this.y);
    rotate(this.rotation + swing);
    imageMode(CENTER);
    image(this.img, 0, 0, this.size, this.size);
    pop();
  }

  isClicked(mx, my) {
    return (
      mx > this.x - this.size / 2 &&
      mx < this.x + this.size / 2 &&
      my > this.y - this.size / 2 &&
      my < this.y + this.size / 2
    );
  }

  onClick() {
    this.targetRotation += PI;
    this.dir *= -1;
    this.clickCount++;

    // 🎆 3 / 5 / 7 次触发
    if (this.clickCount === 3) {
      createFirework(this.x, this.y, 'normal');
    }
    if (this.clickCount === 5) {
      createFirework(this.x, this.y, 'big');
    }
    if (this.clickCount === 7) {
      createFirework(this.x, this.y, 'redpacket');
      this.clickCount = 0; // 重置节奏
    }
  }

  isOut() {
    return this.x < -150 || this.x > width + 150;
  }
}

// ================= 烟花生成 =================
function createFirework(x, y, type) {
  if (type === 'normal') {
    for (let i = 0; i < 30; i++) {
      particles.push(new Particle(x, y, false));
    }
  }

  if (type === 'big') {
    for (let i = 0; i < 80; i++) {
      particles.push(new Particle(x, y, true));
    }
  }

  if (type === 'redpacket') {
    for (let i = 0; i < 18; i++) {
      redPackets.push(new RedPacketParticle(x, y));
    }
  }
}

// ================= 普通粒子 =================
class Particle {
  constructor(x, y, big) {
    this.x = x;
    this.y = y;

    let angle = random(TWO_PI);
    let speed = big ? random(4, 9) : random(2, 5);
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;

    this.life = 255;
    this.size = big ? random(6, 10) : random(4, 6);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.05;
    this.life -= 4;
  }

  show() {
    noStroke();
    fill(255, 180, 0, this.life);
    ellipse(this.x, this.y, this.size);
  }

  isDead() {
    return this.life <= 0;
  }
}

// ================= 红包粒子（烟花式炸开 → 消失） =================
class RedPacketParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    let angle = random(TWO_PI);
    let speed = random(4, 8);
    this.vx = cos(angle) * speed;
    this.vy = sin(angle) * speed;

    this.size = 26;

    this.life = 25;   // 爆炸持续帧数
    this.dead = false;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // 轻微阻尼
    this.vx *= 0.96;
    this.vy *= 0.96;

    this.life--;

    // 💥 爆炸结束的“那一瞬间”
    if (this.life === 0) {
      moneyTexts.push(new MoneyText(this.x, this.y));
      this.dead = true;
    }
  }

  show() {
    push();
    translate(this.x, this.y);
    textAlign(CENTER, CENTER);
    textSize(this.size);
    text('🧧', 0, 0);
    pop();
  }

  isDead() {
    return this.dead;
  }
}


// ================= 漂浮文字 =================
class FloatingText {
  constructor(x, y, txt) {
    this.x = x;
    this.y = y;
    this.txt = txt;

    let a = random(TWO_PI);
    let s = random(1, 3);
    this.vx = cos(a) * s;
    this.vy = sin(a) * s;

    this.w = txt === '马年大吉' ? 160 : 80;
    this.h = 40;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  show() {
    push();
    translate(this.x, this.y);
    rectMode(CENTER);
    noStroke();

    // 🟥 红包式祝福
    if (this.txt === '马年大吉') {
      fill(200, 0, 0);          // 红底
      rect(0, 0, this.w, this.h, 6);
      fill(255, 215, 0);        // 黄字
    } 
    // ⬜ 成功提示
    else {
      fill(255);                // 白底
      rect(0, 0, this.w, this.h, 6);
      fill(200, 0, 0);          // 红字
    }

    textAlign(CENTER, CENTER);
    textSize(20);
    text(this.txt, 0, 1);
    pop();
  }

  isOut() {
    return (
      this.x < -200 ||
      this.x > width + 200 ||
      this.y < -200 ||
      this.y > height + 200
    );
  }
}

// ================= +1亿 漂浮文字 =================
class MoneyText {
  constructor(x, y) {
    this.x = x;
    this.y = y;

    this.vy = -1.5;
    this.life = 255;
  }

  update() {
    this.y += this.vy;
    this.life -= 4;
  }

  show() {
    push();
    translate(this.x, this.y);
    textAlign(CENTER, CENTER);
    textSize(22);
    fill(200, 0, 0, this.life); // 纯红字
    text('+1亿', 0, 0);
    pop();
  }

  isDead() {
    return this.life <= 0;
  }
}

