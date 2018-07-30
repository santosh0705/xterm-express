const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const extractSass = new MiniCssExtractPlugin({
  filename: 'stylesheets/style-bundle.css'
})

module.exports = (env, argv) => {
  return {
    entry: ['./src/client.js'],
    output: {
      path: path.resolve('./client'),
      filename: 'javascripts/client-bundle.js'
    },

    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  'env',
                  {
                    'targets': {
                      'browsers': ['last 2 versions', 'safari >= 7']
                    }
                  }
                ]
              ]
            }
          }
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                minimize: argv.mode === 'production'
              }
            },
            {
              loader: 'sass-loader'
            }
          ]
        },
        {
          test: /\.png$/,
          use: {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              publicPath: '../images',
              outputPath: 'images'
            }
          }
        },
        {
          test: /favicon\.ico$/,
          use: {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'
            }
          }
        }
      ]
    },
    plugins: [
      extractSass
    ]
  }
}
