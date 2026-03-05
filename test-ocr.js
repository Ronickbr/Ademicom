
const url = 'https://tqjpbnplnpujygojgkcy.supabase.co/functions/v1/ocr-label';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxanBibnBsbnB1anlnb2pna2N5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NjAyMjIsImV4cCI6MjA4NzUzNjIyMn0.i6iEk7KqBsct7UG9ADemu9x3DeyEWulof2ugy4xR6JE';

const body = {
    image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
};

fetch(url, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
    },
    body: JSON.stringify(body)
})
    .then(async r => {
        console.log('Status:', r.status);
        const data = await r.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    })
    .catch(e => console.error('Error:', e));
