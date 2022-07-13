const { UserInputError, AuthenticationError } = require('apollo-server');
const jwt = require('jsonwebtoken');
const Author = require('./models/author');
const Book = require('./models/book');
const User = require('./models/user');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub();

const JWT_SECRET = 'secret';

const resolvers = {
  Query: {
    allAuthors: async (root, args) => {
      return await Author.find({});
    },

    allBooks: async (root, args) => {
      if (args.genre) {
        return Book.find({ genres: args.genre }).populate('author');
      } else {
        return Book.find({}).populate('author');
      }
    },
    me: (root, args, context) => {
      return context.currentUser;
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      let checkAuthor;
      const findAuthor = await Author.findOne({ name: args.author }).exec();
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

      const book = new Book({ ...args, author: checkAuthor._id });

      const saveBook = await book.save();

      pubsub.publish('BOOK_ADDED', { bookAdded: book });

      return Book.findById(saveBook._id)
        .populate('author')
        .catch((error) => {
          throw new UserInputError(error.message, {
            invalidArgs: args,
          });
        });
    },

    editAuthor: async (root, args, context) => {
      const author = await Author.findOne({ name: args.name });
      const currentUser = context.currentUser;

      if (!currentUser) {
        throw new AuthenticationError('not authenticated');
      }

      if (!author) {
        throw new UserInputError('author does not exist');
      }

      author.born = args.setBornTo;

      return author.save().catch((error) => {
        throw new UserInputError(error.message, {
          invalidArgs: args,
        });
      });
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
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED']),
    },
  },
};

module.exports = resolvers;
