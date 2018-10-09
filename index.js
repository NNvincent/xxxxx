const serverless = require('serverless-http');
const fs = require('fs');
const path = require('path');
const mount = require('koa-mount');
const serve = require('koa-static');
const Handlebars = require('handlebars');
const Koa = require("koa");
const Router = require("koa-router");
const session = require('koa-session');
const views = require('koa-views');
const svgCaptcha = require('svg-captcha');
const request = require('request');
const bodyParser = require('koa-body');
var mysql = require('mysql');
const pool=require('./db');

const views_path = `${__dirname}/views/`;

const session_config={
    key: 'koa:sess',
    maxAge: 1000 * 60 * 5,
    overwrite: true,
    httpOnly: true,
    signed: true,
};

var app = new Koa();
var router = new Router();

app.keys = ['xxxxx'];
app.use(session(session_config,app));

app.use(bodyParser());
app.use(mount('/assets',serve('assets',{maxage:259200000/3})));
//app.use(mount('/statics',serve('/statics',{maxage:259200000/3})));
app.use(views(views_path,{
    map: {
        html: 'handlebars'
    },
    extension: 'html'
}));


fs.readdirSync(views_path)
    .forEach(file=>{
        var p = path.basename(file,'.html');
       Handlebars.registerPartial(p,fs.readFileSync(`${views_path}/${file}`).toString());
    });

async function filter(input){
    const _input=input.toLowerCase();
    if(_input.indexOf('sleep')!=-1||_input.indexOf('benchmark')!=-1){
        return true;
    }
    return false;
}

//@index
router.get('/',async (ctx,next) =>{
    await ctx.render('index');
    await next();
});


//@blog
router.get('/blog', async (ctx, next)=>{
    await ctx.render('blog');
    await next();
});


//@portfolio
router.get('/portfolio', async (ctx,next)=>{
    await ctx.render('portfolio');
    await next();
});


//@Message_Board
router.get('/Message_Board', async (ctx,next)=>{
    const sql="SELECT * FROM site_message ORDER BY id DESC LIMIT 0,3";
    const message = await pool.query(sql);
    await ctx.render('Message_Board',{message});
    await next();
});

router.post('/Message_Board', async (ctx, next)=>{
    const post_message = ctx.request.body.message;
    const name = ctx.request.body.name;
    const email = ctx.request.body.email;
    const ori_sql="SELECT * FROM site_message ORDER BY id DESC LIMIT 0,3";


    if (post_message && name && email) {
        if(await filter(post_message)||await filter(name)||await filter(email)){
            const notice="<script>alert('hacker!!')</script>";
            const message = await pool.query(ori_sql);
            await ctx.render('Message_Board',{notice,message});
        }else{
            console.log('要插入数据库的消息是:' + post_message);
            const sql = 'INSERT INTO site_message(name,email,message) VALUES (\'' + name + '\',\'' + email + '\',\'' + post_message + '\')';

            const notice=await pool.query(sql).then(function () {
                return "<script>alert('send your message success!')</script>";
            }).catch(function (err) {
                return `<script>alert(unescape('${escape(err)}'))</script>`;
            });
            const message = await pool.query(ori_sql);
            await ctx.render('Message_Board',{notice,message});
        }
    } else {

        const notice="<script>alert('check your input!')</script>";
        const message = await pool.query(ori_sql);
        await ctx.render('Message_Board',{notice,message});

    }

    await next();

});


//@post
router.get('/post', async (ctx, next)=>{

    const id = ctx.query.id;
    const sql = 'select * from site_post WHERE id='+id;

    if(await filter(id)){
        await ctx.render('post', { title: 'Error!', content: 'Error!', summary:'Error!'});
    }
    else{
        const data=await pool.query(sql).then(function(rows){
            return rows;
        }).catch(function(err){
            console.log(err);
            return false;
        });
        if(data[0]){
            await ctx.render('post', { title: data[0].title, content: data[0].content, summary:data[0].summary});
        }else{
            await ctx.render('post', { title: 'Error!', content: 'Error!', summary:'Error!'});
        }
    }

    await next();

});


//@connect_us
router.get('/connect_us', async (ctx, next)=>{
    await ctx.render('connect_us', { });
    await next();
});

router.post('/connect_us', async (ctx, next)=>{

    const advice = ctx.request.body.advice;
    const name = ctx.request.body.name;
    const email = ctx.request.body.email;
    if (advice&&name&&email){

        const sql='INSERT INTO site_advice(name,email,advice) VALUES ('+mysql.escape(name)+','+mysql.escape(email)+','+mysql.escape(advice)+')';

        const notice=await pool.query(sql).then(function () {
            return "<script>alert('send your advice success!')</script>";
        }).catch(function (err) {
            console.log(err);
            return "<script>alert('send faild!')</script>";
        });

        await ctx.render('connect_us',{notice});

    }else{
        const notice="<script>alert('check your input!')</script>";
        await ctx.render('connect_us',{notice});
    }

    await next();

});


//@admin
router.get('/admin', async (ctx, next)=>{
    if(ctx.session.userName){

        const sql="SELECT * FROM site_advice ORDER BY id DESC LIMIT 0,3";
        const username = ctx.session.userName;

        // connection.query(sql1, function(err, message, fields){
        //     if (err){
        //         res.render('admin', {notice: `<script>alert(unescape('${escape(err)}'))</script>`});
        //     }else{
        //         res.render('admin', {username:username,message});
        //     }
        // });

        const data=await pool.query(sql).then(function (rows) {
            return {'username':username,'message':rows};
        }).catch(function(err){
            return {'notice': `<script>alert(unescape('${escape(err)}'))</script>`};
        });
        if(data.notice){
            await ctx.render('admin',{notice:data.notice});
        }else{
            await ctx.render('admin',{username:data.username,message:data.message})
        }

    }else{
        await ctx.render('login');
    }

    await next();
});


//@login
router.get('/login', async (ctx, next)=>{
    if(ctx.session.userName){
        ctx.redirect('/admin');
    }
    await next();
});

router.post('/login', async (ctx, next)=>{

    const username = ctx.request.body.username;
    const password = ctx.request.body.password;
    const authcode = ctx.request.body.authcode;
    const _authcode = ctx.session.authcode;
    if(authcode===_authcode){
        if (username&&password) {
            const sql = "select password_hash from site_user where username = "+mysql.escape(username) ;

            const message=await pool.query(sql).then(function (rows) {
                if(rows&&password == rows[0].password_hash){
                    ctx.session.userName=username;
                    ctx.redirect('/admin');
                }else {
                    return  '账号或密码错误.';
                }
            }).catch(function (err){
                console.log(err);
                return  '账号或密码错误.';
            })

            await ctx.render('login',{message});

            //  res.end(img.getFileData());
        }else{
            await ctx.render('login', {message: '账号和密码不能为空'});
        }
    }else{
        await ctx.render('login', {message: '验证码错误'});
    }
});


//@authpng
router.get('/authpng', async (ctx, next)=>{
    const options = {
        size: 4,
        ignoreChars: '0o1i',
        noise: 2,
        color: true ,
        background: '#D1EEEE'
    };

    const captcha = svgCaptcha.create(options);

    global.authcode = captcha.text.toLowerCase();
    ctx.session.authcode = captcha.text.toLowerCase();
    ctx.response.type='svg';
    ctx.response.status=200;
    ctx.body=captcha.data;

    await next();
});

router.get('/_f1ag233333',async (ctx)=>{
    ctx.body=flag1;
});

app.use(router.routes());

console.log('server is running ,listen at port: 4000')

app.listen(4000);
module.exports.handler = serverless(app);