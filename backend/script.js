import axios from 'axios';
import fs from 'fs';

const events = JSON.parse(fs.readFileSync('demo_events.json', 'utf-8'));

(async () => {
  for (const event of events) {
    try {
      const res = await axios.post('http://localhost:8080/events', event);
      console.log(`✅ Created: ${event.name}`);
    } catch (err) {
      console.error(
        `❌ Failed to create ${event.name}`,
        err.response?.data || err.message,
      );
    }
  }
})();
