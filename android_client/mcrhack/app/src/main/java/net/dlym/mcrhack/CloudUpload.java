package net.dlym.mcrhack;

import android.app.Activity;
import android.content.Context;
import android.telephony.TelephonyManager;
import android.util.JsonWriter;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;

import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Created by leeming on 25/10/15.
 */
public class CloudUpload
{
	private static final String TAG = "CLOUD";
	Cloudinary cloudinary;

	Activity ref;
	public CloudUpload()
	{
		//this.ref=ref;
		Map config = new HashMap();
		config.put("cloud_name", "hackmcr15");
		config.put("api_key", "264312266943231");
		config.put("api_secret", "0X1eDeZLoGkdSTtyrLx7OJ7cSHw");
		this.cloudinary = new Cloudinary(config);
	}


	String upLoadServerUri = "http://dlym.net:3000/image";
	Thread uploadt;
	public void upload(final String filepath)
	{
		Log.i(TAG,"uploady");
		uploadt = new Thread(new Runnable() {
			@Override
			public void run() {
				try
				{

					Map results= cloudinary.uploader().upload(new File(filepath) , ObjectUtils.emptyMap());

					Log.i(TAG, results.toString());

					String myurl=(String)results.get("url");
					//TextView tv = (TextView)ref.findViewById(R.id.txtTo);
					//String tonum=tv.getText().toString();
					String tonum="07947304740";
					String fromnum="666";

// Creating HTTP client
					HttpClient httpClient = new DefaultHttpClient();

// Creating HTTP Post
					HttpPost httpPost = new HttpPost("http://dlym.net:3000/image");
// Building post parameters, key and value pair
					List<NameValuePair> nameValuePair = new ArrayList<NameValuePair>(2);
					nameValuePair.add(new BasicNameValuePair("imageUrl", myurl));

					TelephonyManager tMgr = (TelephonyManager) MainActivity.ref.getSystemService(Context.TELEPHONY_SERVICE);
					nameValuePair.add(new BasicNameValuePair("from", tMgr.getLine1Number()));

					TextView tv = (TextView) MainActivity.ref.findViewById(R.id.txtTo);
					//todo is this number valid?
					nameValuePair.add(new BasicNameValuePair("to", tv.getText().toString()));

					// Url Encoding the POST parameters
					try {
						httpPost.setEntity(new UrlEncodedFormEntity(nameValuePair));
						Log.e(TAG,new UrlEncodedFormEntity(nameValuePair).toString());
					}
					catch (UnsupportedEncodingException e) {
						// writing error to Log
						e.printStackTrace();
					}
// Making HTTP Request
					try {
						HttpResponse response = httpClient.execute(httpPost);

						// writing response to log
						Log.i("Http Response:", response.toString());

					} catch (ClientProtocolException e) {
						// writing exception to log
						e.printStackTrace();

					} catch (IOException e) {
						// writing exception to log
						e.printStackTrace();
					}
				} catch (IOException e) {
					e.printStackTrace();
				}
			}
		});

		uploadt.start();
	}

	public void blockUntilDone()
	{
		while(this.uploadt.isAlive())
		{
			Log.d(TAG,"Has uploader done yet?");
			try {
				Thread.sleep(500);
			} catch (InterruptedException e) {
				e.printStackTrace();
			}
		}
	}

}