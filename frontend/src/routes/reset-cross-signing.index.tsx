// Copyright 2024 New Vector Ltd.
// Copyright 2024 The Matrix.org Foundation C.I.C.
//
// SPDX-License-Identifier: AGPL-3.0-only
// Please see LICENSE in the repository root for full details.

import { createFileRoute, notFound } from "@tanstack/react-router";
import IconCheck from "@vector-im/compound-design-tokens/assets/web/icons/check";
import IconError from "@vector-im/compound-design-tokens/assets/web/icons/error";
import IconInfo from "@vector-im/compound-design-tokens/assets/web/icons/info";
import { Button, Text } from "@vector-im/compound-web";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "urql";
import { ButtonLink } from "../components/ButtonLink";
import LoadingSpinner from "../components/LoadingSpinner";
import PageHeading from "../components/PageHeading";
import {
  VisualList,
  VisualListItem,
} from "../components/VisualList/VisualList";
import { graphql } from "../gql";

const CURRENT_VIEWER_QUERY = graphql(/* GraphQL */ `
  query CurrentViewerQuery {
    viewer {
      __typename
      ... on Node {
        id
      }
    }
  }
`);

export const Route = createFileRoute("/reset-cross-signing/")({
  async loader({ context, abortController: { signal } }) {
    const viewer = await context.client.query(
      CURRENT_VIEWER_QUERY,
      {},
      { fetchOptions: { signal } },
    );
    if (viewer.error) throw viewer.error;
    if (viewer.data?.viewer.__typename !== "User") throw notFound();
  },

  component: ResetCrossSigning,
});

declare global {
  interface Window {
    // Synapse may fling the user here via UIA fallback,
    // this is part of the API to signal completion to the calling client
    // https://spec.matrix.org/v1.11/client-server-api/#fallback
    onAuthDone?(): void;
  }
}

const ALLOW_CROSS_SIGING_RESET_MUTATION = graphql(/* GraphQL */ `
  mutation AllowCrossSigningReset($userId: ID!) {
    allowUserCrossSigningReset(input: { userId: $userId }) {
      user {
        id
      }
    }
  }
`);

function ResetCrossSigning(): React.ReactNode {
  const { deepLink } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { t } = useTranslation();
  const [viewer] = useQuery({ query: CURRENT_VIEWER_QUERY });
  if (viewer.error) throw viewer.error;
  if (viewer.data?.viewer.__typename !== "User") throw notFound();
  const userId = viewer.data.viewer.id;

  const [result, allowReset] = useMutation(ALLOW_CROSS_SIGING_RESET_MUTATION);
  if (result.error) throw result.error;
  const success = !!result.data;

  const onClick = async (): Promise<void> => {
    await allowReset({ userId });

    setTimeout(() => {
      // Synapse may fling the user here via UIA fallback,
      // this is part of the API to signal completion to the calling client
      // https://spec.matrix.org/v1.11/client-server-api/#fallback
      if (window.onAuthDone) {
        window.onAuthDone();
      } else if (window.opener?.postMessage) {
        window.opener.postMessage("authDone", "*");
      }
    });

    navigate({ to: "/reset-cross-signing/success", replace: true });
  };

  return (
    <>
      <PageHeading
        Icon={IconError}
        title={t("frontend.reset_cross_signing.heading")}
        invalid
      />

      <Text className="text-center text-secondary" size="md">
        {t("frontend.reset_cross_signing.description")}
      </Text>

      <VisualList>
        <VisualListItem
          Icon={IconCheck}
          iconColor="var(--cpd-color-icon-success-primary)"
          label={t("frontend.reset_cross_signing.effect_list.positive_1")}
        />
        <VisualListItem
          Icon={IconInfo}
          label={t("frontend.reset_cross_signing.effect_list.neutral_1")}
        />
        <VisualListItem
          Icon={IconInfo}
          label={t("frontend.reset_cross_signing.effect_list.neutral_2")}
        />
      </VisualList>

      <Text className="text-center" size="md" weight="semibold">
        {t("frontend.reset_cross_signing.warning")}
      </Text>

      <Button
        kind="primary"
        destructive
        disabled={result.fetching}
        onClick={onClick}
      >
        {!!result.fetching && <LoadingSpinner inline />}
        {t("frontend.reset_cross_signing.finish_reset")}
      </Button>

      {deepLink ? (
        <ButtonLink to="/reset-cross-signing/cancelled" kind="tertiary" replace>
          {t("action.cancel")}
        </ButtonLink>
      ) : (
        <ButtonLink to="/" kind="tertiary">
          {t("action.back")}
        </ButtonLink>
      )}
    </>
  );
}