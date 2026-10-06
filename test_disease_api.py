import requests

url = "http://127.0.0.1:5000/predict_disease"

image_path = r"C:\Users\SIRI\Downloads\su.jpg"

with open(image_path, "rb") as image:
    files = {
        "image": image
    }

    response = requests.post(url, files=files)

print("Status Code:", response.status_code)
print("Response:")
print(response.json())