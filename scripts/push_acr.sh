#!/usr/bin/env bash
set -euo pipefail

# 本地构建并推送镜像到阿里云 ACR（不经过 GitHub Actions）
# 依赖：已安装 Docker；已在机器上可访问互联网或内网（VPC）

DEFAULT_PUBLIC_REGISTRY="crpi-rx40zx65re5swrdu.cn-hangzhou.personal.cr.aliyuncs.com"
DEFAULT_VPC_REGISTRY="crpi-rx40zx65re5swrdu-vpc.cn-hangzhou.personal.cr.aliyuncs.com"

ALIYUN_REGISTRY="${ALIYUN_REGISTRY:-$DEFAULT_PUBLIC_REGISTRY}"
ALIYUN_REGISTRY_USERNAME="${ALIYUN_REGISTRY_USERNAME:-}"
ALIYUN_REGISTRY_PASSWORD="${ALIYUN_REGISTRY_PASSWORD:-}"
ACR_NAMESPACE="${ACR_NAMESPACE:-joiffer_course}"
IMAGE_NAME="${IMAGE_NAME:-llm_course}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
USE_VPC="${USE_VPC:-false}"
PUSH_LATEST="${PUSH_LATEST:-false}"
TAG_SHA="${TAG_SHA:-false}"

usage() {
  cat <<EOF
本地推送到阿里云 ACR 使用方法：

  ALIYUN_REGISTRY=crpi-...personal.cr.aliyuncs.com \
  ALIYUN_REGISTRY_USERNAME=joiffer \
  ALIYUN_REGISTRY_PASSWORD=your_password \
  ACR_NAMESPACE=joiffer_course \
  IMAGE_NAME=llm_course \
  IMAGE_TAG=latest \
  ./scripts/push_acr.sh

可选环境变量：
  USE_VPC=true        使用内网域名推送（位于 VPC 网络的机器）
  TAG_SHA=true        额外按 git 提交短 SHA 打标签并推送
  PUSH_LATEST=true    同步推送 latest 标签（若 TAG 非 latest）

默认值：
  ALIYUN_REGISTRY: $DEFAULT_PUBLIC_REGISTRY
  ACR_NAMESPACE:   joiffer_course
  IMAGE_NAME:      llm_course
  IMAGE_TAG:       latest
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ "$USE_VPC" == "true" ]]; then
  ALIYUN_REGISTRY="$DEFAULT_VPC_REGISTRY"
fi

if [[ -z "$ALIYUN_REGISTRY_USERNAME" || -z "$ALIYUN_REGISTRY_PASSWORD" ]]; then
  echo "[ERROR] 需要设置 ALIYUN_REGISTRY_USERNAME 与 ALIYUN_REGISTRY_PASSWORD 环境变量" >&2
  echo "例如：ALIYUN_REGISTRY_USERNAME=joiffer ALIYUN_REGISTRY_PASSWORD=*** ./scripts/push_acr.sh" >&2
  exit 1
fi

echo "==> 登录 ACR: $ALIYUN_REGISTRY"
echo "$ALIYUN_REGISTRY_PASSWORD" | docker login "$ALIYUN_REGISTRY" -u "$ALIYUN_REGISTRY_USERNAME" --password-stdin

LOCAL_REF="$IMAGE_NAME:$IMAGE_TAG"
REMOTE_REF="$ALIYUN_REGISTRY/$ACR_NAMESPACE/$IMAGE_NAME:$IMAGE_TAG"

echo "==> 构建本地镜像: $LOCAL_REF"
docker build -t "$LOCAL_REF" .

echo "==> 标记远程镜像: $REMOTE_REF"
docker tag "$LOCAL_REF" "$REMOTE_REF"

echo "==> 推送镜像: $REMOTE_REF"
docker push "$REMOTE_REF"

if [[ "$TAG_SHA" == "true" ]]; then
  SHORT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "manual")
  REMOTE_SHA_REF="$ALIYUN_REGISTRY/$ACR_NAMESPACE/$IMAGE_NAME:$SHORT_SHA"
  echo "==> 额外推送 SHA 标签: $REMOTE_SHA_REF"
  docker tag "$LOCAL_REF" "$REMOTE_SHA_REF"
  docker push "$REMOTE_SHA_REF"
fi

if [[ "$PUSH_LATEST" == "true" && "$IMAGE_TAG" != "latest" ]]; then
  REMOTE_LATEST_REF="$ALIYUN_REGISTRY/$ACR_NAMESPACE/$IMAGE_NAME:latest"
  echo "==> 同步推送 latest 标签: $REMOTE_LATEST_REF"
  docker tag "$LOCAL_REF" "$REMOTE_LATEST_REF"
  docker push "$REMOTE_LATEST_REF"
fi

echo "✅ 完成推送：$REMOTE_REF"

