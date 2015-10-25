package net.dlym.mcrhack;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.app.ProgressDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import android.support.v7.app.ActionBarActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.Toast;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import javax.net.ssl.HttpsURLConnection;


public class MainActivity extends ActionBarActivity {

	private static final String TAG = "MAIN";

	public static MainActivity ref;

	File lastphoto;
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_main);


		MainActivity.ref=this;
		lastphoto = new File("/storage/emulated/0/Download/original.jpg");
		Button btn = (Button) findViewById(R.id.btnSend);
		btn.setOnClickListener(new Button.OnClickListener() {
			public void onClick(View v) {
				AlertDialog.Builder builder = new AlertDialog.Builder(MainActivity.ref);
				builder.setMessage("Please hang on while we subscribe you to cat facts and send your message...")
						.setPositiveButton("Unsubscribe", new DialogInterface.OnClickListener() {
							public void onClick(DialogInterface dialog, int id) {
								// FIRE ZE MISSILES!
							}
						})
						.setNegativeButton("Oh...", new DialogInterface.OnClickListener() {
							public void onClick(DialogInterface dialog, int id) {
								// User cancelled the dialog
							}
						});
				// Create the AlertDialog object and return it
				Dialog dialog = builder.create();
				dialog.show();

				Log.i(TAG, "Uploading to cloud");
				CloudUpload mCu=new CloudUpload();
				mCu.upload(lastphoto.getAbsolutePath());
				//mCu.blockUntilDone();
				Log.i(TAG,"Finished upload?");

			}
		});

		btn = (Button) findViewById(R.id.btnPicture);
		btn.setOnClickListener(new Button.OnClickListener() {
			public void onClick(View v) {
				//Do stuff here
				Log.i(TAG, "Sending intent for photo");
				//lastphoto = dispatchTakePictureIntent();
				//final File mFSend = new File("/storage/emulated/0/Download/original.jpg");
				//Log.i(TAG, "Got picture, saved in " + lastphoto.getAbsolutePath());
				takePicture();

				((Button) findViewById(R.id.btnSend)).setEnabled(true);
			}

		});

	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.menu_main, menu);
		return true;
	}

	@Override
	public boolean onOptionsItemSelected(MenuItem item) {
		// Handle action bar item clicks here. The action bar will
		// automatically handle clicks on the Home/Up button, so long
		// as you specify a parent activity in AndroidManifest.xml.
		int id = item.getItemId();

		//noinspection SimplifiableIfStatement
		if (id == R.id.action_settings) {
			return true;
		}

		return super.onOptionsItemSelected(item);
	}


	String mCurrentPhotoPath;

	private File createImageFile() throws IOException {
		// Create an image file name
		String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
		String imageFileName = "JPEG_" + timeStamp + "_";
		File storageDir = Environment.getExternalStoragePublicDirectory(
				Environment.DIRECTORY_PICTURES);
		File image = File.createTempFile(
				imageFileName,  /* prefix */
				".jpg",         /* suffix */
				storageDir      /* directory */
		);

		// Save a file: path for use with ACTION_VIEW intents
		mCurrentPhotoPath = "file:" + image.getAbsolutePath();
		return image;
	}

	static final int REQUEST_TAKE_PHOTO = 1;

	private static final int CAPTURE_IMAGE_ACTIVITY_REQUEST_CODE = 100;
	private Uri fileUri;

	private File takePicture(){
		File photoFile = null;
		Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
		File imagesFolder = new File(Environment.getExternalStorageDirectory(), "mcr");
		imagesFolder.mkdirs(); // <----
		String timeStamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
		String imageFileName = "msg_" + timeStamp + ".jpg";

		photoFile = new File(imagesFolder, imageFileName);
		Log.i(TAG,"Photo should be savedto "+photoFile.getAbsolutePath());
		fileUri = Uri.fromFile(photoFile);
		//fileUri = getOutputMediaFileUri(MEDIA_TYPE_IMAGE); // create a file to save the image
		takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, fileUri); // set the image file name

		// start the image capture Intent
		startActivityForResult(takePictureIntent, CAPTURE_IMAGE_ACTIVITY_REQUEST_CODE);



		return photoFile;
	}


	private File dispatchTakePictureIntent() {
		File photoFile = null;
		Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
		// Ensure that there's a camera activity to handle the intent
		if (takePictureIntent.resolveActivity(getPackageManager()) != null) {
			// Create the File where the photo should go
			Log.i(TAG,"picture intent");
			try {
				photoFile = createImageFile();
			} catch (IOException ex) {
				// Error occurred while creating the File
				//...
			}
			// Continue only if the File was successfully created
			if (photoFile != null) {
				Log.i(TAG,"picture file created :"+photoFile.getAbsolutePath());
				takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT,
						Uri.fromFile(photoFile));
				startActivityForResult(takePictureIntent, REQUEST_TAKE_PHOTO);
			}
		}

		Log.i(TAG,"returning photoFile");
		return photoFile;
	}



	@Override
	protected void onActivityResult(int requestCode, int resultCode, Intent data) {
		if (requestCode == CAPTURE_IMAGE_ACTIVITY_REQUEST_CODE) {
			if (resultCode == RESULT_OK) {
				// Image captured and saved to fileUri specified in the Intent
				Toast.makeText(getApplicationContext(), "Image saved to:\n" +
						fileUri.toString(), Toast.LENGTH_LONG).show();
				lastphoto=new File(fileUri.getPath());
				//Log.i(TAG,"Image saved to:" +data.toString());
			} else if (resultCode == RESULT_CANCELED) {
				// User cancelled the image capture
				Toast.makeText(getApplicationContext(), "Cancelled", Toast.LENGTH_LONG).show();
			} else {
				// Image capture failed, advise user
				Toast.makeText(getApplicationContext(), "FAILED", Toast.LENGTH_LONG).show();
			}
		}
	}

	public String  performPostCall(String requestURL,
								   HashMap<String, String> postDataParams) {

		URL url;
		String response = "";
		try {
			url = new URL(requestURL);

			HttpURLConnection conn = (HttpURLConnection) url.openConnection();
			conn.setReadTimeout(15000);
			conn.setConnectTimeout(15000);
			conn.setRequestMethod("POST");
			conn.setRequestProperty("Test-key", "test-value");
			conn.setDoInput(true);
			conn.setDoOutput(true);


			OutputStream os = conn.getOutputStream();

			DataOutputStream dos = new DataOutputStream(os);
			//dos.writeBytes();

			dos.flush();
			dos.close();
			os.close();
			int responseCode=conn.getResponseCode();

			if (responseCode == HttpsURLConnection.HTTP_OK) {
				String line;
				BufferedReader br=new BufferedReader(new InputStreamReader(conn.getInputStream()));
				while ((line=br.readLine()) != null) {
					response+=line;
				}
			}
			else {
				response="";

			}

			Log.i(TAG,"RSP is "+response);
		} catch (Exception e) {
			e.printStackTrace();
		}

		return response;
	}



	private String getPostDataString(HashMap<String, String> params) throws UnsupportedEncodingException {
		StringBuilder result = new StringBuilder();
		boolean first = true;
		for(Map.Entry<String, String> entry : params.entrySet()){
			if (first)
				first = false;
			else
				result.append("&");

			result.append(URLEncoder.encode(entry.getKey(), "UTF-8"));
			result.append("=");
			result.append(URLEncoder.encode(entry.getValue(), "UTF-8"));
		}

		return result.toString();
	}


	String upLoadServerUri = "http://dlym.net:3000/image";
	int serverResponseCode = 0;
/**
 public int uploadFile(String sourceFileUri) {


 String fileName = sourceFileUri;

 HttpURLConnection conn = null;
 DataOutputStream dos = null;
 String lineEnd = "\r\n";
 String twoHyphens = "--";
 String boundary = "*****";
 int bytesRead, bytesAvailable, bufferSize;
 byte[] buffer;
 int maxBufferSize = 1 * 1024 * 1024;
 File sourceFile = new File(sourceFileUri);

 if (!sourceFile.isFile()) {

 //dialog.dismiss();

 Log.e("uploadFile", "Source File not exist :"
 + sourceFileUri);

 return 0;

 }
 else
 {
 try {

 // open a URL connection to the Servlet
 FileInputStream fileInputStream = new FileInputStream(sourceFile);
 URL url = new URL(upLoadServerUri);

 // Open a HTTP  connection to  the URL
 conn = (HttpURLConnection) url.openConnection();
 conn.setDoInput(true); // Allow Inputs
 conn.setDoOutput(true); // Allow Outputs
 conn.setUseCaches(false); // Don't use a Cached Copy
 conn.setRequestMethod("POST");
 conn.setRequestProperty("Connection", "Keep-Alive");
 conn.setRequestProperty("ENCTYPE", "multipart/form-data");
 conn.setRequestProperty("Content-Type", "multipart/form-data;boundary=" + boundary);
 //conn.setRequestProperty("uploaded_file", fileName);

 dos = new DataOutputStream(conn.getOutputStream());

 dos.writeBytes(twoHyphens + boundary + lineEnd);
 dos.writeBytes("Content-Disposition: form-data; name=uploaded_file;filename="
 + fileName + lineEnd);

 dos.writeBytes(lineEnd);

 // create a buffer of  maximum size
 bytesAvailable = fileInputStream.available();

 bufferSize = Math.min(bytesAvailable, maxBufferSize);
 buffer = new byte[bufferSize];

 // read file and write it into form...
 bytesRead = fileInputStream.read(buffer, 0, bufferSize);

 while (bytesRead > 0) {

 dos.write(buffer, 0, bufferSize);
 bytesAvailable = fileInputStream.available();
 bufferSize = Math.min(bytesAvailable, maxBufferSize);
 bytesRead = fileInputStream.read(buffer, 0, bufferSize);

 }

 // send multipart form data necesssary after file data...
 dos.writeBytes(lineEnd);
 dos.writeBytes(twoHyphens + boundary + twoHyphens + lineEnd);

 // Responses from the server (code and message)
 serverResponseCode = conn.getResponseCode();
 String serverResponseMessage = conn.getResponseMessage();

 Log.i("uploadFile", "HTTP Response is : "
 + serverResponseMessage + ": " + serverResponseCode);

 if(serverResponseCode == 200){
 Log.i("uploadFile","All ok with upload");
 }

 //close the streams //
 fileInputStream.close();
 dos.flush();
 dos.close();

 } catch (MalformedURLException ex) {

 ex.printStackTrace();

 Log.e("Upload file to server", "error: " + ex.getMessage(), ex);
 } catch (Exception e) {

 e.printStackTrace();
 Log.e("oops", "Exception : "
 + e.getMessage(), e);
 }
 return serverResponseCode;

 } // End else block
 }
 */
}
