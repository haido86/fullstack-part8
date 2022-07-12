import { useQuery } from '@apollo/client';
import { useState } from 'react';
import { ALL_BOOKS } from '../queries';

let genres = ['all genres'];

const Books = (props) => {
  const [nameToSearch, setNameToSearch] = useState('');
  const result = useQuery(ALL_BOOKS, {
    variables: { nameToSearch },
  });

  if (!props.show) {
    return null;
  }
  if (result.loading) {
    return <div>loading...</div>;
  }

  const books = result.data.allBooks;

  result.data.allBooks.forEach((book) => {
    book.genres.forEach((genre) => {
      if (genre && !genres.includes(genre)) {
        genres = [genre, ...genres];
      }
    });
  });

  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ margin: 10, display: 'flex' }}>
        {genres.map((genre) => (
          <button
            onClick={() => setNameToSearch(genre === 'all genres' ? '' : genre)}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Books;
