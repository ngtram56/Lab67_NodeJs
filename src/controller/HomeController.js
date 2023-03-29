const fs = require('fs');
const path = require('path');
const zipper = require('zip-local');
const multer = require('multer');
const dir_name = './src/public/data';

//Configuration for Multer
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, dir_name);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    },
});

// Multer Filter
const multerFilter = (req, file, cb) => {
    let extension = file.originalname.split('.').pop();
    if (extension === 'exe' || extension === 'msi' || extension === 'sh') {
        cb(new Error('Không được phép upload file có định dạng (.ext, .msi, .sh).'), false);
    } else {
        cb(null, true);
    }
};

// Upload file
const upload = multer({
    storage: multerStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // save maximum size 20MB
    fileFilter: multerFilter
});

// Progress
function progress_middlware(req, res, next) {
    let progress = 0;
    let percents = [];
    const file_size = req.headers["content-length"];

    // set event listener
    req.on("data", (chunk) => {
        progress += chunk.length;
        const percentage = (progress / file_size) * 100;
        percents.push(percentage);
    });
    next()
}

class HomeController {

    show(req, res) {
        fs.readdir(dir_name, (err, files) => {
            const data_folder = [];
            const data_file = [];
            if (err) throw err;
            files.forEach(file => {
                let stat = fs.statSync(dir_name + '/' + file);
                // console.log(stat);
                if (stat.isDirectory()) {
                    data_folder.push({
                        'name': file,
                        'link': dir_name + '/' + file,
                        'type': 'Folder',
                        'size': formatBytes(stat.size),
                        'last_modified': formatDate(stat.mtime),
                    });
                } else if (stat.isFile()) {
                    data_file.push({
                        'index': data_file.length,
                        'name': file,
                        'link': dir_name + '/' + file,
                        'ext': file.split('.').pop(),
                        'type': 'File',
                        'size': formatBytes(stat.size),
                        'last_modified': formatDate(stat.mtime),
                    });
                }
                // console.log(data_file);
                // console.log(data_folder);
            });
            // Logged in
            res.render('index', {
                username: req.session.username,
                success: req.flash('success'),
                error: req.flash('error'),
                errorFile: req.flash('errorCreateFile'),
                errorFolder: req.flash('errorCreateFolder'),
                errorRename: req.flash('errorRename'),
                lastValue: req.flash('lastValueRename'),
                csrfToken: req.csrfToken(),
                files: data_file,
                folders: data_folder,
                title: 'Trang chủ'
            });
        });
    }

    downloadFile(req, res) {
        let fileDownload = path.join(dir_name + '/' + req.query.filename);

        // console.log(fileDownload)
        if (path.extname(fileDownload).length > 1) {
            res.download(fileDownload)
        } else {
            var filename = dir_name + '/' + req.query.filename + '.zip';
            zipper.sync.zip(fileDownload).compress().save(filename);
            res.download(filename)

            // set headers
            res.attachment(fileDownload);

            // send file
            var stream = fs.createReadStream(filename);
            stream.pipe(res).once('close', function () {
                stream.destroy();
                fs.unlink(filename, function (err) {
                    if (err) throw err;
                });
            });

        }
    }

    deleteFile(req, res) {
        let flashmsg = '';
        let filename = req.query.name_file_delete;
        let fileDelete = path.join(dir_name + '/' + filename);
        console.log(fileDelete)

        if (path.extname(fileDelete).length > 1) {
            // remove file
            fs.unlink(fileDelete, (err) => {
                if (err) {
                    flashmsg = `Xảy ra lỗi khi xóa file <strong>${filename}</strong>. Error: ${err.message}`
                    req.flash('error', flashmsg)
                } else {
                    flashmsg = `Xóa file <strong>${filename}</strong> thành công.`
                    req.flash('success', flashmsg)
                }
                res.redirect(301, '/');
            });
        } else {
            // remove directory
            fs.rmdir(fileDelete, { recursive: true }, err => {
                if (err) {
                    flashmsg = `Xảy ra lỗi khi xóa thư mục <strong>${filename}</strong>. Error: ${err.message}`
                    req.flash('error', flashmsg)
                } else {
                    flashmsg = `Xóa thư mục <strong>${filename}</strong> thành công.`
                    req.flash('success', flashmsg)
                }
                res.redirect(301, '/');
            })
        }
    }



    uploadFile(req, res) {
        let fileUpload = upload.single('file_upload');

        fileUpload(req, res, err => {
            let fileUpload = req.file;
            let flashmsg = '';
            if (!fileUpload) {
                flashmsg = 'File chưa được chọn.';
            }
            if (err) {
                if (err.message === 'File too large') {
                    flashmsg = 'Kích thước file upload quá lớn. Vui lòng chọn file có kích thước < 20MB!';
                } else {
                    flashmsg = err.message;
                }
            }

            if (flashmsg.length > 0) {
                req.flash('error', flashmsg)
            } else {
                let filename = req.file.filename;
                req.flash('success', `Tải file <strong>${filename}</strong> lên thành công.`)
            }
            res.redirect(301, '/');
        });
    }

    createFile(req, res) {
        let filename = req.body.name_new_file;
        let content = req.body.content;
        if (filename != '') {
            // create a new file
            let newFile = path.join(dir_name + '/' + filename);
            console.log(newFile);
            fs.writeFile(newFile + '.txt', content, err => {
                if (err) {
                    req.flash('error', 'Lỗi xảy ra khi tạo file mới. Vui lòng kiểm tra lại tên file.')
                } else {
                    req.flash('success', `Tạo file <strong>${filename}.txt</strong> thành công.`)
                }
                res.redirect(301, '/');
            });
        } else {
            req.flash('error', null, { delete: true });
            req.flash('success', null, { delete: true });
            req.flash('errorCreateFile', 'Bạn chưa nhập tên file.')
            res.redirect(301, '/');
        }
    }

    createFolder(req, res) {
        let foldername = req.body.name_new_folder;
        if (foldername != '') {
            // create a new folder
            let newFolder = path.join(dir_name + '/' + foldername);
            console.log(newFolder);
            if (!fs.existsSync(newFolder)) {
                fs.mkdir(newFolder, err => {
                    if (err) {
                        req.flash('error', 'Lỗi xảy ra khi tạo folder mới. Vui lòng kiểm tra lại tên folder.')
                    } else {
                        req.flash('success', `Tạo thư mục <strong>${foldername}</strong> thành công.`)
                    }
                    res.redirect(301, '/');
                });
            } else {
                req.flash('error', 'Tên folder đã tồn tại. Vui lòng nhập tên khác.')
                res.redirect(301, '/');
            }
        } else {
            req.flash('error', null, { delete: true });
            req.flash('success', null, { delete: true });
            req.flash('errorCreateFolder', 'Bạn chưa nhập tên folder.')
            res.redirect(301, '/');
        }
    }

    rename(req, res) {
        let oldName = req.body.old_name;
        let newName = req.body.new_name;
        let type = req.body.file_type;
        if (newName != '') {
            if (type == 'File') {
                // rename file
                let currentPath = path.join(dir_name + '/' + oldName);
                let newPath = path.join(dir_name + '/' + newName);
                fs.rename(currentPath, newPath, err => {
                    if (err) {
                        req.flash('error', 'Lỗi xảy ra khi đổi tên file. Vui lòng kiểm tra lại tên file.')
                    } else {
                        req.flash('success', `Đổi tên file <strong>${oldName} -> ${newName}</strong> thành công.`)
                    }
                    res.redirect(301, '/');
                });
            } else {
                // rename folder
                let currentPath = path.join(dir_name + '/' + oldName);
                let newPath = path.join(dir_name + '/' + newName);
                fs.rename(currentPath, newPath, err => {
                    if (err) {
                        req.flash('error', 'Lỗi xảy ra khi đổi tên folder. Vui lòng kiểm tra lại tên folder.')
                    } else {
                        req.flash('success', `Đổi tên thư mục <strong>${oldName} -> ${newName}</strong> thành công.`)
                    }
                    res.redirect(301, '/');
                });
            }
        } else {
            let last = []
            last.push(oldName, type);
            req.flash('error', null, { delete: true });
            req.flash('success', null, { delete: true });
            req.flash('errorRename', 'Bạn chưa nhập tên mới.');
            req.flash('lastValueRename', last)
            res.redirect(301, '/');
        }
    }
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2)
        month = '0' + month;
    if (day.length < 2)
        day = '0' + day;

    return [day, month, year].join('-');
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return 0

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

module.exports = new HomeController;