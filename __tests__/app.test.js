require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('app routes', () => {
  describe('routes', () => {
    let token;
  
    beforeAll(async done => {
      execSync('npm run setup-db');
  
      client.connect();
  
      const signInData = await fakeRequest(app)
        .post('/auth/signup')
        .send({
          email: 'jon@user.com',
          password: '1234'
        });
      
      token = signInData.body.token; // eslint-disable-line
  
      return done();
    });
  
    afterAll(done => {
      return client.end(done);
    });

    test('returns documents', async() => {

      const expectation = [
        {
          id: 1,
          title: 'The First Document',
          body_text: 'This is a document with some text in the body.',
          owner_id: 1
        },
        {
          id: 2,
          title: 'Untitled',
          body_text: 'There is no content here.',
          owner_id: 1
        },
        {
          id: 3,
          title: 'See Spot Type',
          body_text: 'oiejfoskdfdfOSDO SODOSDNRF9843OUEWJ - Spot is a dog and is bad at typing.',
          owner_id: 1
        }
      ];

      const data = await fakeRequest(app)
        .get('/documents')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expectation);
    });
  });
});
