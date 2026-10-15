package com.niuge.zuiwen;

import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.provider.MediaStore;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import org.json.JSONObject;
import java.io.*;
import java.net.*;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends Activity {
 private static final String HOME="https://zxwdfgg-tech.github.io/-zxwdfgg-tech.github.io/dc-daily/";
 private WebView web; private ProgressBar progress; private TextView status;
 private final AtomicBoolean saving=new AtomicBoolean(false), cancelled=new AtomicBoolean(false);
 private ProgressDialog saveDialog; private File pending; private boolean firstResume=true;
 private volatile HttpURLConnection activeConnection; private String activeUrl, activeName;
 private int dp(int value){return (int)(value*getResources().getDisplayMetrics().density+.5f);}
 public void onCreate(Bundle state){
  super.onCreate(state);
  LinearLayout root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);
  progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal); progress.setMax(100);
  root.addView(progress,new LinearLayout.LayoutParams(-1,5));
  web=new WebView(this); root.addView(web,new LinearLayout.LayoutParams(-1,0,1));
  LinearLayout toolbar=new LinearLayout(this); toolbar.setPadding(8,0,8,0);
  Button refresh=new Button(this); refresh.setText("刷新今日"); refresh.setOnClickListener(v->{web.reload();setStatus("正在更新今日资讯…");});
  Button save=new Button(this); save.setText("保存当前图片"); save.setOnClickListener(v->saveVisible());
  toolbar.addView(refresh,new LinearLayout.LayoutParams(0,dp(48),1)); toolbar.addView(save,new LinearLayout.LayoutParams(0,dp(48),2));
  root.addView(toolbar); status=new TextView(this); status.setTextSize(12); status.setPadding(14,5,14,8); status.setText("相册保存修复版 1.3 · 保存结果会在这里显示"); root.addView(status); setContentView(root);
  WebSettings s=web.getSettings(); s.setJavaScriptEnabled(true); s.setDomStorageEnabled(true); s.setCacheMode(WebSettings.LOAD_DEFAULT);
  s.setAllowFileAccess(false); s.setAllowContentAccess(false); s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  s.setSupportZoom(true); s.setBuiltInZoomControls(true); s.setDisplayZoomControls(false); s.setUseWideViewPort(true); s.setLoadWithOverviewMode(true);
  s.setUserAgentString(s.getUserAgentString()+" DataCenterDaily/1.3");
  web.addJavascriptInterface(new SaveBridge(),"NativeDaily");
  web.setWebViewClient(new WebViewClient(){
   public boolean shouldOverrideUrlLoading(WebView v,String url){
    if(validImage(url)){saveImage(url,URLUtil.guessFileName(url,null,null));return true;}
    if(trustedPage(url))return false;
    openExternal(url);return true;
   }
   public void onPageFinished(WebView v,String url){ if(trustedPage(url))setStatus("1.3 · 点网页保存，或用下方“保存当前图片”"); }
  });
  web.setWebChromeClient(new WebChromeClient(){ public void onProgressChanged(WebView v,int p){progress.setProgress(p); progress.setVisibility(p==100?View.GONE:View.VISIBLE);} });
  web.setDownloadListener((url,ua,disp,mime,size)->{ if(validImage(url))saveImage(url,URLUtil.guessFileName(url,disp,mime));else openExternal(url); });
  web.setOnLongClickListener(v->{WebView.HitTestResult h=web.getHitTestResult();if(h!=null&&validImage(h.getExtra())){
   final String url=h.getExtra();new AlertDialog.Builder(this).setItems(new String[]{"保存这张图片到相册"},(a,n)->saveImage(url,URLUtil.guessFileName(url,null,null))).show();return true;}return false;});
  if(state==null||web.restoreState(state)==null)web.loadUrl(HOME+"?app=1.3");
 }
 private boolean trustedPage(String url){try{Uri u=Uri.parse(url);return "https".equals(u.getScheme())&&"zxwdfgg-tech.github.io".equals(u.getHost())&&u.getPath()!=null&&u.getPath().startsWith("/-zxwdfgg-tech.github.io/dc-daily/");}catch(Exception e){return false;}}
 private boolean validImage(String url){try{return trustedPage(url)&&Uri.parse(url).getPath().matches("/-zxwdfgg-tech\\.github\\.io/dc-daily/images/[A-Za-z0-9_-]+\\.(png|jpg|jpeg|webp)");}catch(Exception e){return false;}}
 private void setStatus(String text){runOnUiThread(()->{if(status!=null)status.setText(text);});}
 private void notifyPage(String state,String message,Uri uri){
  runOnUiThread(()->{setStatus(message);if(web!=null&&trustedPage(web.getUrl())){
   try{JSONObject j=new JSONObject();j.put("status",state);j.put("message",message);j.put("version","1.3");if(uri!=null)j.put("uri",uri.toString());
    web.evaluateJavascript("window.dispatchEvent(new CustomEvent('daily-save-result',{detail:"+j.toString()+"}))",null);
   }catch(Exception ignored){}
  }});
 }
 private void openExternal(String url){try{Uri u=Uri.parse(url);if(!"https".equals(u.getScheme())&&!"http".equals(u.getScheme()))throw new IOException();startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){setStatus("无法打开浏览器，请检查系统浏览器是否可用");}}
 public class SaveBridge {
  @JavascriptInterface public String getVersion(){return "1.3";}
  @JavascriptInterface public void saveImage(final String url,final String filename){runOnUiThread(()->{
   if(web==null||!trustedPage(web.getUrl())){setStatus("当前页面不支持保存，请点刷新今日后重试");return;}
   MainActivity.this.saveImage(url,filename);
  });}
 }
 private void saveVisible(){
  setStatus("正在获取当前图片…");
  String js="(function(){var r=document.getElementById('reader');if(r&&r.open){var a=r.querySelector('#reader-downloads a[download]');if(a)return {url:a.href,name:a.getAttribute('download')};}var p=document.querySelector('.poster-button');if(p&&p.dataset.downloadUrl)return {url:p.dataset.downloadUrl,name:p.dataset.downloadName};var n=document.getElementById('initial-data'),t=document.getElementById('latest-title');if(n&&t){var e=JSON.parse(n.textContent).editions||[];for(var i=0;i<e.length;i++)if(e[i].title===t.textContent)return {url:new URL(e[i].download||e[i].image,location.href).href,name:'数据中心每日资讯_'+e[i].date+'.jpg'};}return null;})()";
  web.evaluateJavascript(js,value->{try{JSONObject j=new JSONObject(value);saveImage(j.getString("url"),j.optString("name","数据中心每日资讯.jpg"));}catch(Exception e){setStatus("尚未取得图片，请先打开一张资讯图后再点保存");new AlertDialog.Builder(this).setMessage("请先打开一张资讯图，再点下方保存当前图片。").setPositiveButton("知道了",null).show();}});
 }
 private void saveImage(final String url,final String requestedName){
  if(!validImage(url)){notifyPage("error","图片地址无效，请刷新后重试",null);return;}
  if(!saving.compareAndSet(false,true)){setStatus("图片正在保存，请稍候");return;}
  cancelled.set(false);activeUrl=url;activeName=requestedName;
  saveDialog=new ProgressDialog(this);saveDialog.setTitle("保存高清图片");saveDialog.setMessage("正在下载，请稍候…");saveDialog.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);saveDialog.setIndeterminate(true);saveDialog.setCancelable(false);
  saveDialog.setButton(DialogInterface.BUTTON_NEGATIVE,"取消",(a,b)->{cancelled.set(true);HttpURLConnection c=activeConnection;if(c!=null)c.disconnect();notifyPage("cancelled","已取消保存",null);});saveDialog.show();
  notifyPage("saving","正在下载高清图片，完成后写入相册…",null);
  final String ua=web.getSettings().getUserAgentString();
  new Thread(()->{
   File temp=null;
   try{
    String ext=Uri.parse(url).getLastPathSegment();ext=ext.substring(ext.lastIndexOf('.')+1);
    String mime="png".equals(ext)?"image/png":("webp".equals(ext)?"image/webp":"image/jpeg");
    String name=(requestedName==null?"数据中心每日资讯":requestedName).replaceAll("[\\\\/:*?\"<>|]","_");
    if(name.length()>100||!name.endsWith("."+ext))name="数据中心每日资讯_"+System.currentTimeMillis()+"."+ext;
    temp=File.createTempFile("daily-","."+ext,getCacheDir());
    downloadTo(url,ua,temp);
    BitmapFactory.Options bounds=new BitmapFactory.Options();bounds.inJustDecodeBounds=true;BitmapFactory.decodeFile(temp.getPath(),bounds);
    if(bounds.outWidth<1||bounds.outHeight<1)throw new IOException("服务器未返回有效图片");
    if(cancelled.get())throw new InterruptedIOException("已取消");
    if(Build.VERSION.SDK_INT>=29){
     notifyPage("saving","下载完成，正在写入手机相册…",null);
     ContentValues cv=new ContentValues();cv.put(MediaStore.MediaColumns.DISPLAY_NAME,name);cv.put(MediaStore.MediaColumns.MIME_TYPE,mime);cv.put("relative_path","Pictures/DataCenterDaily");cv.put("is_pending",1);
     Uri dest=null;
     try{
      dest=getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI,cv);if(dest==null)throw new IOException("无法创建相册图片");
      copy(temp,dest);ContentValues done=new ContentValues();done.put("is_pending",0);if(getContentResolver().update(dest,done,null,null)<1)throw new IOException("无法完成相册登记");
      File completed=temp;temp=null;completed.delete();saving.set(false);success(dest,"已保存到相册：DataCenterDaily");
     }catch(Exception e){if(dest!=null)getContentResolver().delete(dest,null,null);if(cancelled.get())throw e;File fallback=temp;temp=null;offerFileFallback(fallback,name,mime);}
    }else{File ready=temp;temp=null;chooseFile(ready,name,mime);}
   }catch(Exception e){
    if(temp!=null)temp.delete();saving.set(false);
    if(cancelled.get())notifyPage("cancelled","已取消保存",null);else failure(url,e);
   }finally{HttpURLConnection c=activeConnection;if(c!=null)c.disconnect();activeConnection=null;dismissProgress();}
  },"daily-save").start();
 }
 private void downloadTo(String url,String ua,File dest)throws IOException{
  IOException failure=null;
  for(int attempt=0;attempt<2;attempt++){
   if(cancelled.get())throw new InterruptedIOException("已取消");
   HttpURLConnection c=null;
   try{
    c=(HttpURLConnection)new URL(url).openConnection();activeConnection=c;c.setInstanceFollowRedirects(false);c.setConnectTimeout(15000);c.setReadTimeout(30000);c.setRequestProperty("User-Agent",ua);c.setRequestProperty("Accept","image/*");
    int code=c.getResponseCode();if(code!=200)throw new IOException("下载服务返回 HTTP "+code);
    final int expected=c.getContentLength();long total=0;
    try(InputStream in=c.getInputStream();OutputStream out=new FileOutputStream(dest,false)){
     byte[] b=new byte[32768];int n;while((n=in.read(b))!=-1){if(cancelled.get())throw new InterruptedIOException("已取消");total+=n;if(total>32*1024*1024)throw new IOException("图片超过32MB");out.write(b,0,n);final int percent=expected>0?(int)Math.min(100,total*100/expected):-1;runOnUiThread(()->{if(saveDialog!=null&&saveDialog.isShowing()){saveDialog.setIndeterminate(percent<0);if(percent>=0)saveDialog.setProgress(percent);}});}
    }
    if(total<100||(expected>0&&total!=expected))throw new IOException("下载中断，图片不完整");return;
   }catch(IOException e){failure=e;if(cancelled.get())throw e;notifyPage("saving","下载暂未完成，正在重试…",null);}finally{if(c!=null)c.disconnect();}
  }
  throw failure;
 }
 private void dismissProgress(){runOnUiThread(()->{if(saveDialog!=null){saveDialog.dismiss();saveDialog=null;}});}
 private void copy(File from,Uri dest)throws IOException{
  try(InputStream in=new FileInputStream(from);OutputStream out=getContentResolver().openOutputStream(dest)){
   if(out==null)throw new IOException("无法写入保存位置");byte[] b=new byte[32768];int n;long total=0;while((n=in.read(b))!=-1){if(cancelled.get())throw new InterruptedIOException("已取消");out.write(b,0,n);total+=n;}out.flush();if(total!=from.length())throw new IOException("图片写入不完整");
  }
 }
 private void success(Uri dest,String message){runOnUiThread(()->{dismissProgress();notifyPage("saved",message,dest);new AlertDialog.Builder(this).setTitle("图片已保存").setMessage(message+"\n可在相册或照片App中查看。").setPositiveButton("打开图片",(a,b)->{try{startActivity(new Intent(Intent.ACTION_VIEW).setDataAndType(dest,"image/*").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION));}catch(Exception e){setStatus("图片已保存，请在相册中打开");}}).setNegativeButton("完成",null).show();});}
 private void failure(String url,Exception e){runOnUiThread(()->{dismissProgress();String reason=e instanceof SocketTimeoutException?"网络连接超时":(e.getMessage()==null?"保存未完成":e.getMessage());notifyPage("error","保存失败："+reason,null);new AlertDialog.Builder(this).setTitle("图片未保存").setMessage(reason+"\n可以重试，或交给系统浏览器下载。").setPositiveButton("重试",(a,b)->saveImage(url,activeName)).setNeutralButton("浏览器下载",(a,b)->openExternal(url)).setNegativeButton("关闭",null).show();});}
 private void offerFileFallback(File file,String name,String mime){runOnUiThread(()->{dismissProgress();notifyPage("waiting","相册写入未完成，可改存到文件",null);new AlertDialog.Builder(this).setTitle("改存到文件").setMessage("高清图片已下载，但相册暂时无法写入。请选择手机中的保存位置。").setPositiveButton("选择保存位置",(a,b)->chooseFile(file,name,mime)).setNegativeButton("取消",(a,b)->{file.delete();saving.set(false);notifyPage("cancelled","已取消保存",null);}).setCancelable(false).show();});}
 private void chooseFile(File file,String name,String mime){runOnUiThread(()->{dismissProgress();pending=file;notifyPage("waiting","请选择保存位置，然后点保存",null);try{Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType(mime);i.putExtra(Intent.EXTRA_TITLE,name);startActivityForResult(i,41);}catch(Exception e){pending=null;file.delete();saving.set(false);failure(activeUrl,e);}});}
 protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==41){final File file=pending;pending=null;if(file==null)return;if(result!=RESULT_OK||data==null||data.getData()==null){file.delete();saving.set(false);notifyPage("cancelled","已取消保存",null);return;}final Uri dest=data.getData();new Thread(()->{try{copy(file,dest);success(dest,"图片已保存到你选择的位置");}catch(Exception e){failure(activeUrl,e);}finally{file.delete();saving.set(false);}},"daily-file-copy").start();}}
 protected void onResume(){super.onResume();if(web!=null){web.onResume();if(!firstResume)web.evaluateJavascript("window.dispatchEvent(new Event('daily-resume'))",null);firstResume=false;}}
 protected void onPause(){if(web!=null)web.onPause();super.onPause();}
 protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);web.saveState(state);}
 public void onBackPressed(){web.evaluateJavascript("(function(){var d=document.getElementById('reader');if(d&&d.open){var b=d.querySelector('[data-action=close]');if(b)b.click();return true;}return false;})()",value->{if(!"true".equals(value)){if(web.canGoBack())web.goBack();else finish();}});}
 protected void onDestroy(){cancelled.set(true);HttpURLConnection c=activeConnection;if(c!=null)c.disconnect();if(saveDialog!=null)saveDialog.dismiss();if(web!=null){web.removeJavascriptInterface("NativeDaily");web.destroy();web=null;}super.onDestroy();}
}
