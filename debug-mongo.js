import { MongoClient } from 'mongodb';

async function checkMongoDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://sihabsorker:0QbHvqaHUBVi62jj@cluster0.ijcuovp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('linkshortener');
    const clicksCollection = db.collection('clicks');
    
    // Check total clicks count
    const totalClicks = await clicksCollection.countDocuments();
    console.log('Total clicks in database:', totalClicks);
    
    // Get latest 5 clicks
    const latestClicks = await clicksCollection.find().sort({_id: -1}).limit(5).toArray();
    console.log('Latest clicks:');
    latestClicks.forEach((click, index) => {
      console.log(`\n--- Click ${index + 1} ---`);
      console.log('ID:', click.id);
      console.log('Link ID:', click.linkId);
      console.log('IP Address:', click.ipAddress || 'unknown');
      console.log('Device Type:', click.deviceType || 'unknown');
      console.log('Device Model:', click.deviceModel || 'unknown');
      console.log('Operating System:', click.operatingSystem || 'unknown');
      console.log('Platform:', click.platform || 'unknown');
      console.log('Browser:', click.browser || 'unknown');
      console.log('Browser Version:', click.browserVersion || 'unknown');
      console.log('Screen Resolution:', click.screenResolution || 'unknown');
      console.log('Viewport Size:', click.viewportSize || 'unknown');
      console.log('Device Pixel Ratio:', click.devicePixelRatio || 'unknown');
      console.log('Color Depth:', click.colorDepth || 'unknown');
      console.log('CPU Cores:', click.cpuCores || 'unknown');
      console.log('Device Memory:', click.deviceMemory || 'unknown');
      console.log('Language:', click.language || 'unknown');
      console.log('Timezone:', click.timezone || 'unknown');
      console.log('Country:', click.country || 'unknown');
      console.log('City:', click.city || 'unknown');
      console.log('Region:', click.region || 'unknown');
      console.log('ISP:', click.isp || 'unknown');
      console.log('Connection Type:', click.connectionType || 'unknown');
      console.log('Network Speed:', click.networkSpeed || 'unknown');
      if (click.latitude && click.longitude) {
        console.log('GPS Location:', `${click.latitude}, ${click.longitude} (accuracy: ${click.accuracy || 'unknown'})`);
      }
      console.log('Battery Level:', click.batteryLevel || 'unknown');
      console.log('Is Charging:', click.isCharging ? 'Yes' : 'No');
      console.log('Orientation:', click.orientation || 'unknown');
      console.log('Touch Support:', click.touchSupport ? 'Yes' : 'No');
      console.log('Cookies Enabled:', click.cookiesEnabled ? 'Yes' : 'No');
      console.log('JavaScript Enabled:', click.javaScriptEnabled ? 'Yes' : 'No');
      console.log('Do Not Track:', click.doNotTrack ? 'Yes' : 'No');
      console.log('Session ID:', click.sessionId || 'unknown');
      console.log('Clicked At:', click.clickedAt);
    });
    
  } catch (error) {
    console.error('MongoDB Error:', error);
  } finally {
    await client.close();
  }
}

checkMongoDB();