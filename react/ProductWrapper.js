import PropTypes from 'prop-types'
import React, { useMemo, useState } from 'react'
import { last, head, path } from 'ramda'
import { Helmet, useRuntime } from 'vtex.render-runtime'
import { ProductContext as ProductContextApp } from 'vtex.product-context'

import StructuredData from './components/StructuredData'

import useDataPixel from './hooks/useDataPixel'

const ProductWrapper = ({
  params: { slug },
  productQuery,
  productQuery: { product, loading } = {},
  query,
  children,
  ...props
}) => {
  const { account } = useRuntime()

  const [selectedQuantity, setSelectedQuantity] = useState(1)

  const pixelEvents = useMemo(() => {
    const {
      titleTag,
      brand,
      categoryId,
      categoryTree,
      productId,
      productName,
      items,
    } = product || {}

    if (!product || typeof document === 'undefined') {
      return []
    }

    const pageInfo = {
      event: 'pageInfo',
      eventType: 'productView',
      accountName: account,
      pageCategory: 'Product',
      pageDepartment: categoryTree ? head(categoryTree).name : '',
      pageFacets: [],
      pageTitle: titleTag,
      pageUrl: window.location.href,
      productBrandName: brand,
      productCategoryId: Number(categoryId),
      productCategoryName: categoryTree ? last(categoryTree).name : '',
      productDepartmentId: categoryTree ? head(categoryTree).id : '',
      productDepartmentName: categoryTree ? head(categoryTree).name : '',
      productId: productId,
      productName: productName,
      skuStockOutFromProductDetail: [],
      skuStockOutFromShelf: [],
    }

    const skuId = query.skuId || (items && head(items).itemId)

    const [sku] =
      (items && items.filter(product => product.itemId === skuId)) || []

    const { ean, referenceId, sellers } = sku || {}

    pageInfo.productEans = [ean]

    if (referenceId && referenceId.length >= 0) {
      const [{ Value: refIdValue }] = referenceId

      pageInfo.productReferenceId = refIdValue
    }

    if (sellers && sellers.length >= 0) {
      const [{ commertialOffer, sellerId }] = sellers

      pageInfo.productListPriceFrom = `${commertialOffer.ListPrice}`
      pageInfo.productListPriceTo = `${commertialOffer.ListPrice}`
      pageInfo.productPriceFrom = `${commertialOffer.Price}`
      pageInfo.productPriceTo = `${commertialOffer.Price}`
      pageInfo.sellerId = `${sellerId}`
      pageInfo.sellerIds = `${sellerId}`
    }

    // Add selected SKU property to the product object
    product.selectedSku = query.skuId ? query.skuId : product.items[0].itemId

    return [
      pageInfo,
      {
        event: 'productView',
        product,
      },
    ]
  }, [account, product, query.skuId])

  useDataPixel(pixelEvents, loading)

  const { titleTag, metaTagDescription } = product || {}

  const items = path(['items'], product) || []

  const selectedItem = query.skuId
    ? items.find(sku => sku.itemId === query.skuId)
    : items[0]

  const value = useMemo(
    () => ({
      product,
      categories: path(['categories'], product),
      selectedItem,
      onChangeQuantity: setSelectedQuantity,
      selectedQuantity,
    }),
    [product, selectedItem, setSelectedQuantity, selectedQuantity]
  )

  return (
    <div className="vtex-product-context-provider">
      <Helmet
        title={titleTag}
        meta={[
          metaTagDescription && {
            name: 'description',
            content: metaTagDescription,
          },
        ].filter(Boolean)}
      />
      <ProductContextApp.Provider value={value}>
        {product && <StructuredData product={product} query={query} />}
        {React.cloneElement(children, {
          productQuery,
          slug,
          ...props,
        })}
      </ProductContextApp.Provider>
    </div>
  )
}

ProductWrapper.propTypes = {
  params: PropTypes.object,
  productQuery: PropTypes.object,
  children: PropTypes.node,
  /* URL query params */
  query: PropTypes.object,
}

export default ProductWrapper
