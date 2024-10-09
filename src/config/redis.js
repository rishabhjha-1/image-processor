const { createClient } = require('redis');

const redisClient = createClient({
    password: 'QgZJHL5HFpt4Ltwu9AuFvl7JnpL68PGg',
    socket: {
        host: 'redis-17349.c275.us-east-1-4.ec2.redns.redis-cloud.com',
        port: 17349
    }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log('Connected to Redis');
    } catch (error) {
        console.error('Failed to connect to Redis', error);
    }
};

module.exports = {redisClient:redisClient,connectRedis:connectRedis};
