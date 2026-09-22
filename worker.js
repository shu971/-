import html from './index.html';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default {async fetch(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(!path.startsWith('/api/')){if(!['GET','HEAD'].includes(request.method))return new Response('Method Not Allowed',{status:405});if(path!=='/'&&path!=='/index.html')return new Response('Not Found',{status:404});return new Response(request.method==='HEAD'?null:html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff'}});}
 try{
 if(!['GET','POST'].includes(request.method))return json({error:'対応していない操作です'},405);
 let data;
 if(request.method==='POST'){
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'送信元が異なります'},403);
  if(!request.headers.get('Content-Type')?.includes('application/json'))return json({error:'JSONで送信してください'},415);
  if(Number(request.headers.get('Content-Length'))>8192)return json({error:'入力が長すぎます'},413);
  const raw=await request.text();if(raw.length>8192)return json({error:'入力が長すぎます'},413);
  try{data=JSON.parse(raw);}catch{return json({error:'入力を確認してください'},400);}
  if(!data||typeof data!=='object')return json({error:'入力を確認してください'},400);
 }
 if(path==='/api/votes'){
  if(request.method==='POST'){if(!['claude','codex','both','new'].includes(data.choice))return json({error:'投票先が不正です'},400);await env.DB.prepare('UPDATE votes SET count=count+1 WHERE choice=?').bind(data.choice).run();}
  return json({votes:(await env.DB.prepare('SELECT choice,count FROM votes').all()).results});
 }
 if(path==='/api/comments'){
  if(request.method==='POST'){
   if(typeof data.body!=='string'||!data.body.trim()||data.body.trim().length>1000)return json({error:'コメントは1〜1,000文字で入力してください'},400);
   const comment=await env.DB.prepare('INSERT INTO comments(body) VALUES (?) RETURNING *').bind(data.body.trim()).first();return json({comment},201);
  }
  const before=url.searchParams.get('before');if(before!==null&&!/^[1-9][0-9]*$/.test(before))return json({error:'ページ指定が不正です'},400);
  const rows=(await (before?env.DB.prepare('SELECT * FROM comments WHERE id < ? ORDER BY id DESC LIMIT 21').bind(before):env.DB.prepare('SELECT * FROM comments ORDER BY id DESC LIMIT 21')).all()).results;
  return json({comments:rows.slice(0,20),next:rows.length>20?rows[19].id:null});
 }
 const match=path.match(/^\/api\/comments\/([1-9][0-9]*)\/reactions$/);
 if(match&&request.method==='POST'){
  if(!['like','dislike'].includes(data.kind))return json({error:'リアクションが不正です'},400);
  const column=data.kind==='like'?'likes':'dislikes';
  const comment=await env.DB.prepare('UPDATE comments SET '+column+'='+column+'+1 WHERE id=? RETURNING *').bind(match[1]).first();
  return comment?json({comment}):json({error:'コメントが見つかりません'},404);
 }
 return json({error:'見つかりません'},404);
 }catch(error){console.error('community_api_error',error.message);return json({error:'一時的なエラーです。時間をおいて再試行してください'},500);}
}};