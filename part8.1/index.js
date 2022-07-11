const { v1: uuid } = require('uuid');

const {
  ApolloServer,
  UserInputError,
  gql,
  AuthenticationError,
} = require('apollo-server');
const mongoose = require('mongoose');
const Author = require('./models/author');
const Book = require('./models/book');
const User = require('./models/user');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'secret';

const MONGODB_URI = 'TODO';

console.log('connecting to', MONGODB_URI);

mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message);
  });

const typeDefs = gql`
  type Author {
    name: String!
    id: ID!
    born: Int
    bookCount: Int
  }

  type Book {
    title: String!
    published: String!
    author: Author!
    genres: [String]
    id: ID!
  }
  type User {
    username: String!
    favouriteGenre: String
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    allAuthors: [Author]
    allBooks(genre: String, author: String): [Book]
    me: User
  }
  type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [String!]
    ): Book!
    editAuthor(name: String!, setBornTo: Int!): Author
    createUser(username: String!, favouriteGenre: String): User
    login(username: String!, password: String!): Token
  }
`;

const resolvers = {
  Query: {
    allAuthors: async (root, args) => {
      console.log('allAuthors');
      return await Author.find({});
    },

    allBooks: async (root, args) => {
      return Book.find({}).populate('author');
    },
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Mutation: {
    addBook: async (root, args) => {
      let checkAuthor;
      const findAuthor = await Author.findOne({ name: args.author }).exec();
      // console.log('findAuthor', findAuthor);
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new AuthenticationError('not authenticated');
      }
      if (!findAuthor) {
        const author = new Author({
          name: args.author,
        });

        checkAuthor = await author.save();
      } else {
        checkAuthor = findAuthor;
      }

      console.log('checkAuthor', checkAuthor);
      const book = new Book({ ...args, author: checkAuthor._id });

      try {
        await book.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
    },
    editAuthor: async (root, args) => {
      const author = await Author.findOne({ name: args.name });
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new AuthenticationError('not authenticated');
      }

      if (!author) {
        throw new UserInputError('author does not exist');
      }

      author.born = args.setBornTo;

      try {
        await author.save();
      } catch (error) {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      }
    },
    createUser: async (root, args) => {
      const user = new User({
        username: args.username,
        favouriteGenre: args.favouriteGenre,
      });
      return user.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username });
      if (!user || args.password !== 'secret') {
        throw new UserInputError('wrong credentials');
      }
      const userForToken = {
        username: user.username,
        id: user._id,
      };
      return { value: jwt.sign(userForToken, JWT_SECRET) };
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const auth = req ? req.headers.authorization : null;
    if (auth && auth.toLowerCase().startsWith('bearer ')) {
      const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET);
      const currentUser = await User.findById(decodedToken.id);
      return { currentUser };
    }
  },
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
