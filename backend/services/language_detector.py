import langid

def detect_language(text):
    language, _ = langid.classify(text)
    return language

if __name__ == '__main__':
    sample_text = "Hello, how are you?"
    detected_language = detect_language(sample_text)
    print(f'The detected language is: {detected_language}')