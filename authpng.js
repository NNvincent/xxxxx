var http = require('http');
var fs = require('fs');
var z = require('zengming');
var BMP24 = z.BMP24;
var font = z.Font;


makeCapcha = function () {
    var img = new BMP24(100, 40);
    //画曲线
    var w=img.w/2;
    var h=img.h;
    var color = z.rand(0, 0xffffff);
    var y1=z.rand(-5,5); //Y轴位置调整
    var w2=z.rand(5,15); //数值越小越多弯
    var h3=z.rand(3,6); //数值越小幅度越大
    var bl = z.rand(1,5);
    for(var i=-w; i<w; i+=0.1) {       
        var y = Math.floor(h/h3*Math.sin(i/w2)+h/2+y1);
        var x = Math.floor(i+w);
        img.drawPoint(x, y, color)
        for(var j=0; j<bl; j++){        
        //    img.drawPoint(x, y+j, color);          
        }
    }
    var color = z.rand(0, 0xffffff);
    var y1=z.rand(-5,5); //Y轴位置调整
    var w2=z.rand(5,15); //数值越小越多弯
    var h3=z.rand(3,6); //数值越小幅度越大
    var bl = z.rand(1,5);
    for(var i=-w; i<w; i+=0.1) {       
        var y = Math.floor(h/h3*Math.sin(i/w2)+h/2+y1);
        var x = Math.floor(i+w);
        img.drawPoint(x, y, color)
        for(var j=0; j<bl; j++){        
        //    img.drawPoint(x, y+j, color);          
        }
    }
    //画点
    var n = 20;//点数个
    var p_w=img.w;//画的宽
    var p_h=img.h;//画的高   
    for(var i = 1;i<=n;i++){
        var p_x = p_w*(i/n);
        var p_y = p_h*(i/n);
        var p_color = z.rand(0, 0xffffff);
        var k = z.rand(0,p_w);
        var k1 = z.rand(0,p_h);
        var size = z.rand(1,5);//点的大小
        img.fillRect(p_x+k, p_y+k1,p_x+k-size,p_y+k1-size, p_color)
    }
    var p = "abcdefghijklmnopqrstuvwxyz3456789";
    var str = '';
    for(var i=0; i<4; i++){
        str += p.charAt(Math.random() * p.length |0);
    }
    var fonts = [font.font8x16, font.font12x24, font.font16x32];
    var x = 15, y=8;
    for(var i=0; i<str.length; i++){
        var f = fonts[Math.random() * fonts.length |0];
        y = 8 + z.rand(-10, 10);
        img.drawChar(str[i], x, y, f, z.rand(0, 0xffffff));
        x += f.w + z.rand(12, 8);
    }
  
    var authcode = {};
    authcode.img = img;
    authcode.code = str;
    return authcode;
}
//   var img = makeCapcha();
//   res.end(img.getFileData());

module.exports = makeCapcha;