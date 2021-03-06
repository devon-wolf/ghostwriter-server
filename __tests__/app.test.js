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

    // unprotected route with test docs to confirm basic functionality
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

    test('creates a document as the test user', async() => {
      const newDoc = {
        title: 'I Am a Special User',
        body_text: 'And I write secret text in this secret place.'
      };

      const expectation = 
        {
          id: 4,
          title: 'I Am a Special User',
          body_text: 'And I write secret text in this secret place.',
          owner_id: 2
        };

      const data = await fakeRequest(app)
        .post('/api/documents')
        .set({ Authorization: token })
        .send(newDoc)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expectation);
    });

    test('edits a document as the test user', async() => {
      const editedDoc = {
        title: 'I Am Special',
        body_text: 'But I don\'t need to prove myself to you.'
      };

      const expectation = 
        {
          id: 4,
          title: 'I Am Special',
          body_text: 'But I don\'t need to prove myself to you.',
          owner_id: 2
        };

      const data = await fakeRequest(app)
        .put('/api/documents/4')
        .set({ Authorization: token })
        .send(editedDoc)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expectation);
    });

    test('gets all documents as the test user', async() => {
      const expectation = [
        {
          id: 4,
          title: 'I Am Special',
          body_text: 'But I don\'t need to prove myself to you.',
          owner_id: 2
        }
      ];

      const data = await fakeRequest(app)
        .get('/api/documents')
        .set({ Authorization: token })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(data.body).toEqual(expectation);

    });

  });
});
