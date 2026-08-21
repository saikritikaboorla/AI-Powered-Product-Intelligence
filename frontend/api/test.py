from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/')
@app.route('/api/test')
def test():
    return jsonify({"status": "ok", "message": "Python Flask is working on Vercel!"})

# Vercel handler
handler = app
