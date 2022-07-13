import { useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';
import { ALL_BOOKS, USER } from '../queries';

const Recommend = () => {
  const [nameToSearch, setNameToSearch] = useState('');
  const result = useQuery(USER);

  const booksResult = useQuery(ALL_BOOKS, {
    variables: { nameToSearch, skip: !nameToSearch },
  });
  const books = booksResult?.data?.allBooks;

  useEffect(() => {
    const favouriteGenre = result?.data?.me?.favouriteGenre;
    if (favouriteGenre) {
      setNameToSearch(favouriteGenre);
    }
  }, [result.data]);

  if (result.loading) {
    return <div>loading...</div>;
  }

  return (
    <div>
      <h2> Recommend </h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
            <th>genres</th>
          </tr>
          {books?.map((a) => (
            <tr key={a.id}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
              <td>{a.genres}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Recommend;
