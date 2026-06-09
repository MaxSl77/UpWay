"""
Yandex Object Storage (S3-compatible) wrapper.
"""
import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile
import uuid

from app.core.config import settings


class StorageService:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.YOS_ENDPOINT_URL,
            aws_access_key_id=settings.YOS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.YOS_SECRET_ACCESS_KEY,
            region_name=settings.YOS_REGION,
        )
        self.bucket = settings.YOS_BUCKET_NAME

    async def upload_file(
        self,
        file: UploadFile,
        prefix: str = "uploads",
    ) -> str:
        """Upload a file and return its public URL."""
        ext = file.filename.rsplit(".", 1)[-1] if file.filename else "bin"
        key = f"{prefix}/{uuid.uuid4()}.{ext}"

        self.client.upload_fileobj(
            file.file,
            self.bucket,
            key,
            ExtraArgs={"ContentType": file.content_type or "application/octet-stream"},
        )
        return f"{settings.YOS_ENDPOINT_URL}/{self.bucket}/{key}"

    def delete_file(self, url: str) -> None:
        key = url.split(f"/{self.bucket}/", 1)[-1]
        try:
            self.client.delete_object(Bucket=self.bucket, Key=key)
        except ClientError:
            pass


storage = StorageService()
