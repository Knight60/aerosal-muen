gcloud storage buckets update gs://klongyong.appspot.com --cors-file=cors.json

gcloud storage buckets describe gs://klongyong.appspot.com --format="default(cors_config)"


gsutil -m -o GSUtil:parallel_composite_upload_threshold=100M cp -r KlongYong@20240308-09.b3dms gs://klongyong.appspot.com

REM -------------------------------------------------------
REM  Allow allusers for Storage Reader
REM -------------------------------------------------------
REM Storage Browser
REM https://console.cloud.google.com/storage/browser
REM https://cloud.google.com/storage/docs/using-cors#command-line