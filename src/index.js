'use strict';

import Client from 'ssh2';
import extend from 'extend';
import { EventEmitter} from 'events';
import { LineStream } from 'byline';
import { WritableStreamBuffer } from 'stream-buffers';

let connection,
    completeCallback,
    customBuffer = false,
    writeableBuffer = new WritableStreamBuffer();

export default class Ashtray extends EventEmitter {
    constructor(options) {
        super();

        this.connectionOptions = extend({
            port: 4118,
            username: 'status',
            //The device seems to have a very narrow support of cipher suites that ssh2 doesnt have enabled by default
            algorithms: {
                cipher: ['aes128-cbc']
            }
        }, options);

        connection = new Client();

        connection.on('ready', () => {
            connection.shell(false, (err, stream) => {
                let lineStream = new LineStream(),
                    linesRead = 0,
                    readingBanner = true;

                if (err) {
                    completeCallback(err);
                }

                //The first 5 lines back from the device are a banner, but it isn't compatible with the banner()
                //function in ssh2.
                let bannerChecker = () => {
                    linesRead++;

                    if (linesRead === 5) {
                        readingBanner = false;

                        //Now we can start piping to the output buffer
                        stream.pipe(writeableBuffer);
                        this.emit('begin');

                        //Ideally we would use stream.end(), but if we do this the device hangs up halfway through
                        //giving us the config.
                        stream.write('export config to console\n');
                    }
                };

                //Pipe to linestream to break up the output on newlines
                stream.pipe(lineStream);

                //Close the connection when we close the stream
                stream.on('close', () => {
                    connection.end();
                });

                lineStream.on('readable', () => {
                    let line;

                    while (null !== (line = lineStream.read())) {
                        if (readingBanner) {
                            bannerChecker();
                        } else {
                            if (!customBuffer) {
                                this.emit('dataRead', writeableBuffer.size());
                            }

                            //Test for the end of the configuration file so that we know when to hang up.
                            if (line.toString().indexOf('</profile>') >= 0) {
                                stream.end('\n');
                            }
                        }
                    }
                });

                //Write something to the shell to trigger the banner
                stream.write('\n');
            });
        });

        connection.on('end', () => {
            this.emit('end');
            completeCallback();
        });
    }

    download(outputBuffer) {
        return new Promise((resolve, reject) => {
            if (outputBuffer) {
                customBuffer = true;
                writeableBuffer = outputBuffer;
            }

            completeCallback = (err) => {
                if (err) {
                    return reject(err);
                }

                if (!customBuffer) {
                    return resolve(writeableBuffer.getContentsAsString('utf-8'));
                }

                return resolve();
            };

            connection.connect(this.connectionOptions);
        });
    }
}
