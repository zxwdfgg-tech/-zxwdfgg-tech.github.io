package com.zhiweishixun.idclab;
import android.app.Activity;
import android.os.Bundle;
import android.annotation.SuppressLint;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.view.ViewGroup;
import android.view.Gravity;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import android.widget.Toast;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.webkit.WebResourceRequest;
import android.webkit.WebChromeClient;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
 private final String[] urls={"https://lab.edwartens.com/data-centre-simulator","https://lab.edwartens.com/substation-mcc-simulator","https://mepvirtual.com/"};
 private final String[] labels={"数据中心","MCC配电室","MEPVirtual"};
 private WebView page;
 private TextView tip;
 private String js="";
 private int tab=0;
 private boolean chinese=true;
 private int dp(float n){return (int)(n*getResources().getDisplayMetrics().density+0.5);}
 private Button btn(String s){Button b=new Button(this);b.setText(s);b.setAllCaps(false);b.setTextColor(Color.WHITE);b.setTextSize(12);b.setBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(21,75,88)));return b;}
 private boolean allowed(Uri u){String h=u.getHost();return "https".equalsIgnoreCase(u.getScheme())&&(h!=null)&&(h.equals("lab.edwartens.com")||h.equals("mepvirtual.com")||h.equals("www.mepvirtual.com"));}
 @SuppressLint("SetJavaScriptEnabled")
 @Override public void onCreate(Bundle bundle){
 super.onCreate(bundle);
 getWindow().setStatusBarColor(Color.rgb(5,25,39));getWindow().setNavigationBarColor(Color.rgb(5,25,39));
 try(BufferedReader r=new BufferedReader(new InputStreamReader(getAssets().open("translator.js"),StandardCharsets.UTF_8))){StringBuilder s=new StringBuilder();String ln;while((ln=r.readLine())!=null)s.append(ln).append('\n');js=s.toString();}catch(Exception e){js="";}
 LinearLayout shell=new LinearLayout(this);shell.setOrientation(LinearLayout.VERTICAL);shell.setBackgroundColor(Color.rgb(7,22,37));
 TextView title=new TextView(this);title.setText("⚡ 实训原站 · 中文助手");title.setTextSize(16);title.setTextColor(Color.WHITE);title.setPadding(dp(12),dp(12),dp(10),dp(10));shell.addView(title);
 LinearLayout tabs=new LinearLayout(this);tabs.setPadding(dp(4),0,dp(4),dp(4));
 for(int i=0;i<3;i++){final int k=i;Button b=btn(labels[i]);tabs.addView(b,new LinearLayout.LayoutParams(0,dp(45),1));b.setOnClickListener(v->{tab=k;page.loadUrl(urls[k]);});}
 shell.addView(tabs);
 LinearLayout tools=new LinearLayout(this);tools.setGravity(Gravity.CENTER_VERTICAL);tools.setPadding(dp(5),0,dp(5),dp(5));
 Button language=btn("中 / EN");tools.addView(language,new LinearLayout.LayoutParams(dp(77),dp(40)));language.setOnClickListener(v->{chinese=!chinese;page.evaluateJavascript("window.__cnSetLanguage&&window.__cnSetLanguage('"+(chinese?"zh":"en")+"')",null);Toast.makeText(this,chinese?"中文模式":"原文模式",Toast.LENGTH_SHORT).show();});
 Button reload=btn("刷新");tools.addView(reload,new LinearLayout.LayoutParams(dp(58),dp(40)));reload.setOnClickListener(v->page.reload());
 Button browser=btn("浏览器");tools.addView(browser,new LinearLayout.LayoutParams(dp(73),dp(40)));browser.setOnClickListener(v->{try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(page.getUrl())));}catch(Exception ignored){}});
 tip=new TextView(this);tip.setText("需要联网");tip.setTextSize(11);tip.setTextColor(Color.rgb(180,209,220));tip.setPadding(dp(7),0,0,0);tools.addView(tip,new LinearLayout.LayoutParams(0,dp(40),1));shell.addView(tools);
 page=new WebView(this);page.setBackgroundColor(Color.rgb(9,24,39));page.setLayerType(android.view.View.LAYER_TYPE_HARDWARE,null);
 WebSettings w=page.getSettings();w.setJavaScriptEnabled(true);w.setDomStorageEnabled(true);w.setDatabaseEnabled(true);w.setAllowFileAccess(false);w.setAllowContentAccess(false);w.setJavaScriptCanOpenWindowsAutomatically(false);w.setSupportZoom(true);w.setBuiltInZoomControls(true);w.setDisplayZoomControls(false);w.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
 page.setWebChromeClient(new WebChromeClient(){@Override public void onProgressChanged(WebView v,int progress){tip.setText(progress<100?"加载 "+progress+"%":"原站运行");}});
 page.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest request){if(allowed(request.getUrl()))return false;try{startActivity(new Intent(Intent.ACTION_VIEW,request.getUrl()));}catch(Exception ignored){}return true;}
   @Override public void onPageFinished(WebView v,String u){if(allowed(Uri.parse(u))&&!js.isEmpty())v.evaluateJavascript(js+"\n;window.__cnSetLanguage&&window.__cnSetLanguage('"+(chinese?"zh":"en")+"')",null);}
   @Override public void onReceivedError(WebView v,WebResourceRequest r,android.webkit.WebResourceError error){if(r.isForMainFrame())tip.setText("加载失败，请检查网络");}
 });
 shell.addView(page,new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,0,1));setContentView(shell);
 if(bundle!=null)tab=Math.max(0,Math.min(2,bundle.getInt("tab",0)));
 page.loadUrl(urls[tab]);
 }
 @Override protected void onSaveInstanceState(Bundle b){b.putInt("tab",tab);super.onSaveInstanceState(b);}
 @Override public void onBackPressed(){if(page!=null&&page.canGoBack())page.goBack();else super.onBackPressed();}
 @Override protected void onDestroy(){if(page!=null){page.destroy();page=null;}super.onDestroy();}
}