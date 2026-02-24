import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Arena } from './pages/Arena';
import { ProblemDetail } from './pages/ProblemDetail';
import { SubmitProblem } from './pages/SubmitProblem';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { Auth } from './pages/Auth';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: 'arena', Component: Arena },
      { path: 'problem/:id', Component: ProblemDetail },
      { path: 'submit', Component: SubmitProblem },
      { path: 'leaderboard', Component: Leaderboard },
      { path: 'profile', Component: Profile },
      { path: 'auth', Component: Auth },
      { path: '*', Component: NotFound },
    ],
  },
]);
