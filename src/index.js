const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const { makeExecutableSchema } = require('graphql-tools');
const apicache = require('apicache');
apicache.options({ debug: true, enabled: process.env.CACHE === 'true' });

// Some fake data
const books = [
  {
    title: "Harry Potter and the Sorcerer's stone",
    author: 'J.K. Rowling',
  },
  {
    title: 'Jurassic Park',
    author: 'Michael Crichton',
  },
];

// The GraphQL schema in string form
const typeDefs = /* GraphQL */ `
  type Query {
    books: [Book]
  }

  type Book {
    title: String
    author: String
  }
`;

// The resolvers
const resolvers = {
  Query: {
    // Simulate slow data access
    books: () => new Promise(resolve => setTimeout(() => resolve(books), Math.random() * 1000)),
  },
};

// Put together a schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// A map from query id -> query text
// How this is created and persisted depends on your app
const queryMap = {
  a: /* GraphQL */ `
    query A {
      books {
        title
        author
      }
    }
  `,
  b: /* GraphQL */ `
    query B {
      books {
        author
      }
    }
  `,
};

// server-side lookup middleware for finding query id -> query text
function persistedQueryParser(req, res, next) {
  if (req.query.id) {
    req.query.query = queryMap[req.query.id];
  }
  next();
}

// Initialize the app
const app = express();

// The GraphQL endpoint
app.use(
  '/graphql',
  // in-memory cache for demo -- in production this could be done via CDN
  apicache.middleware('60 seconds'),
  // register our lookup middleware
  persistedQueryParser,
  graphqlExpress({ schema }),
);

// Start the server
app.listen(3000, () => {
  console.log('Go to http://localhost:3000/graphiql to run queries!');
});
