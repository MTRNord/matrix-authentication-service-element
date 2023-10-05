// Copyright 2023 The Matrix.org Foundation C.I.C.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { Body, H5 } from "@vector-im/compound-web";

import { FragmentType, graphql, useFragment } from "../../gql";
import { Link } from "../../routing";
import Block from "../Block";

import styles from "./BrowserSessionsOverview.module.css";

export const FRAGMENT = graphql(/* GraphQL */ `
  fragment BrowserSessionsOverview_user on User {
    id

    browserSessions(first: 0, state: ACTIVE) {
      totalCount
    }
  }
`);

const BrowserSessionsOverview: React.FC<{
  user: FragmentType<typeof FRAGMENT>;
}> = ({ user }) => {
  const data = useFragment(FRAGMENT, user);

  // allow this until we get i18n
  const pluraliseSession = (count: number): string =>
    count === 1 ? "session" : "sessions";

  return (
    <Block className={styles.sessionListBlock}>
      <div className={styles.sessionListBlockInfo}>
        <H5>Browsers</H5>
        <Body>
          {data.browserSessions.totalCount} active{" "}
          {pluraliseSession(data.browserSessions.totalCount)}
        </Body>
      </div>
      <Link kind="button" route={{ type: "browser-session-list" }}>
        View all
      </Link>
    </Block>
  );
};

export default BrowserSessionsOverview;